const prisma = require('../config/prisma');
const { sendMessage } = require('./whatsapp'); // Assuming this exists or similar

class FlowService {
    constructor() {
        this.isProcessing = false;
    }

    /**
     * Trigger a flow based on type and input
     * @param {string} triggerType - NEW_CONTACT, KEYWORD
     * @param {object} data - { contact, message }
     */
    async triggerFlow(triggerType, data) {
        try {
            console.log(`Checking triggers for ${triggerType}`);

            // Find active flows matching this trigger
            const flows = await prisma.flow.findMany({
                where: {
                    isActive: true,
                    triggerType: triggerType,
                    // For KEYWORD, we might need to check the keyword match later or here?
                    // Simplified: We get all matching types and filter in code if needed
                }
            });

            for (const flow of flows) {
                // For KEYWORD trigger, check if message matches
                if (triggerType === 'KEYWORD' && flow.triggerKeyword) {
                    const msgContent = data.message?.body || '';
                    if (!msgContent.toLowerCase().includes(flow.triggerKeyword.toLowerCase())) {
                        continue;
                    }
                }

                // Start execution
                await this.startExecution(flow, data.contact);
            }
        } catch (error) {
            console.error('Trigger flow error:', error);
        }
    }

    async startExecution(flow, contact) {
        try {
            // Get start node (usually the one with NO incoming handles, or typed 'trigger')
            // For React Flow, content is { nodes, edges }
            const { nodes, edges } = flow.content;

            // Find the node connected to the trigger or the first node
            // Typically in these UIs, the "Trigger" is a node. 
            // We look for the node that the Trigger connects TO.
            const triggerNode = nodes.find(n => n.type === 'trigger');
            if (!triggerNode) {
                console.error(`Flow ${flow.id} has no trigger node`);
                return;
            }

            const firstEdge = edges.find(e => e.source === triggerNode.id);
            if (!firstEdge) {
                console.log(`Flow ${flow.id} trigger has no connection`);
                return;
            }

            const startNodeId = firstEdge.target;

            const execution = await prisma.flowExecution.create({
                data: {
                    flowId: flow.id,
                    contactId: contact.id,
                    status: 'IN_PROGRESS',
                    currentStep: startNodeId,
                    variables: {}
                }
            });

            console.log(`Started execution ${execution.id} for Flow ${flow.id}`);

            // Run asynchronously
            this.processExecution(execution.id);

        } catch (e) {
            console.error('Start execution error:', e);
        }
    }

    async processExecution(executionId) {
        const execution = await prisma.flowExecution.findUnique({
            where: { id: executionId },
            include: { flow: true, contact: true }
        });

        if (!execution || execution.status !== 'IN_PROGRESS') return;

        const { nodes, edges } = execution.flow.content;
        let currentNodeId = execution.currentStep;

        // processing loop
        while (currentNodeId) {
            const node = nodes.find(n => n.id === currentNodeId);
            if (!node) {
                await this.completeExecution(executionId, 'COMPLETED');
                break;
            }

            console.log(`Processing node ${node.id} (${node.type}) for execution ${executionId}`);

            try {
                // Execute Node Logic
                const result = await this.executeNodeStep(node, execution.contact, execution.variables);

                if (result.action === 'PAUSE') {
                    // Update current step basically "stays" here or moves to next but waits?
                    // Usually for delays, we calculate the wakeup time.
                    // But here 'status' might remain IN_PROGRESS, but we stop the loop.
                    // The DELAY node specifically should be handled.

                    // If it's a delay, we might want to store "resumeAt". 
                    // Since we don't have a resumeAt column, we implicitly assume 'PENDING' state waiting for poller?
                    // Or better: update variables with resumeTime and exit loop.
                    await prisma.flowExecution.update({
                        where: { id: executionId },
                        data: { variables: { ...execution.variables, ...result.variables } }
                    });
                    return; // Stop processing, let poller pick it up
                }

                // Move to next node
                const nextNodeId = this.getNextNodeId(node, edges, result.outcome);

                if (!nextNodeId) {
                    await this.completeExecution(executionId, 'COMPLETED');
                    break;
                }

                currentNodeId = nextNodeId;

                // Update progress in DB
                await prisma.flowExecution.update({
                    where: { id: executionId },
                    data: { currentStep: currentNodeId }
                });

            } catch (err) {
                console.error(`Error processing execution ${executionId}:`, err);
                await this.completeExecution(executionId, 'FAILED');
                break;
            }
        }
    }

    async executeNodeStep(node, contact, variables) {
        switch (node.type) {
            case 'message':
                // Send WhatsApp Message
                const message = node.data.message || '';
                if (message) {
                    // Replace variables like {{name}}
                    const text = message.replace(/{{name}}/g, contact.name);
                    await sendMessage(contact.phone, text);
                }
                return { action: 'CONTINUE' };

            case 'delay':
                const delayMinutes = parseInt(node.data.delay || 0) || 0;
                const resumeAt = Date.now() + (delayMinutes * 60 * 1000);

                // Logic: If we are ALREADY resuming (checked via variable), then continue. 
                // Else, pause.
                if (variables[`delay_done_${node.id}`]) {
                    return { action: 'CONTINUE' }; // We just resumed
                } else {
                    return {
                        action: 'PAUSE',
                        variables: {
                            [`resume_at_${node.id}`]: resumeAt,
                            [`waiting_on_node`]: node.id
                        }
                    };
                }

            case 'condition':
                // Check some condition
                // Simpler version: check tag
                // Outcome: 'true' or 'false'
                // This assumes edges have "sourceHandle" or similar to distinguish paths
                return { action: 'CONTINUE', outcome: 'true' }; // TODO: implement actual logic

            default:
                return { action: 'CONTINUE' };
        }
    }

    getNextNodeId(currentNode, edges, outcome) {
        // Find edges starting from this node
        const outgoing = edges.filter(e => e.source === currentNode.id);

        if (outgoing.length === 0) return null;

        if (outgoing.length === 1) return outgoing[0].target;

        // If multiple, dependent on outcome (e.g. condition node handles)
        // Assuming edges have 'sourceHandle' matching outcome 'true'/'false'
        if (outcome) {
            const match = outgoing.find(e => e.sourceHandle === outcome || e.label === outcome);
            return match ? match.target : outgoing[0].target;
        }

        return outgoing[0].target;
    }

    async completeExecution(id, status) {
        await prisma.flowExecution.update({
            where: { id },
            data: { status, currentStep: null }
        });
    }

    // Cron job function
    async processDelays() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Find executions that are IN_PROGRESS and PAUSED (implied by variables)
            // Limitations of JSON filtering in Prisma depend on DB. 
            // We fetch IN_PROGRESS and filter across memory for MVP or use raw query.
            const executions = await prisma.flowExecution.findMany({
                where: { status: 'IN_PROGRESS' }
            });

            for (const exec of executions) {
                const vars = exec.variables || {};
                const waitingNode = vars.waiting_on_node;

                if (waitingNode) {
                    const resumeAt = vars[`resume_at_${waitingNode}`];
                    if (resumeAt && Date.now() >= resumeAt) {
                        // Time to resume!
                        console.log(`Resuming execution ${exec.id}`);

                        // Update variable to mark delay as done so we don't loop
                        const newVars = { ...vars };
                        delete newVars[`resume_at_${waitingNode}`];
                        delete newVars.waiting_on_node;
                        newVars[`delay_done_${waitingNode}`] = true;

                        await prisma.flowExecution.update({
                            where: { id: exec.id },
                            data: { variables: newVars }
                        });

                        // Resume processing
                        this.processExecution(exec.id);
                    }
                }
            }

        } catch (e) {
            console.error('Process delays error:', e);
        } finally {
            this.isProcessing = false;
        }
    }
}

module.exports = new FlowService();
