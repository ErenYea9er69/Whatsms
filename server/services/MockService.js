const prisma = require('../config/prisma');

/**
 * Service to simulate WhatsApp message delivery and status updates
 * 
 * Used when running in development/mock mode
 */
class MockService {
    constructor() {
        this.activeSimulations = new Set();
    }

    /**
     * Start simulating a campaign's delivery
     * @param {number} campaignId 
     */
    startCampaignSimulation(campaignId) {
        console.log(`[MockService] Starting simulation for campaign ${campaignId}`);
        this.activeSimulations.add(campaignId);

        // Run in background
        this._processCampaign(campaignId).catch(err => {
            console.error(`[MockService] Simulation error for campaign ${campaignId}:`, err);
            this.activeSimulations.delete(campaignId);
        });
    }

    async _processCampaign(campaignId) {
        // 1. Fetch all recipients for the campaign
        const recipients = await prisma.campaignRecipient.findMany({
            where: { campaignId },
            select: { id: true, status: true }
        });

        console.log(`[MockService] Found ${recipients.length} recipients for campaign ${campaignId}`);

        // 2. Simulate sending over a period of time
        // We'll process them in batches to feel realistic
        const batchSize = 5;
        const delayBetweenBatches = 2000; // 2 seconds

        for (let i = 0; i < recipients.length; i += batchSize) {
            if (!this.activeSimulations.has(campaignId)) break;

            const batch = recipients.slice(i, i + batchSize);

            await Promise.all(batch.map(async (recipient) => {
                // Determine reliability (not every message succeeds)
                const shouldFail = Math.random() > 0.95; // 5% failure rate

                if (shouldFail) {
                    await prisma.campaignRecipient.update({
                        where: { id: recipient.id },
                        data: {
                            status: 'FAILED',
                        }
                    });
                    await prisma.campaign.update({
                        where: { id: campaignId },
                        data: { statsFailed: { increment: 1 } }
                    });
                } else {
                    // Success flow
                    // a) Sent -> Delivered
                    await this._simulateStatusChange(recipient.id, campaignId, 'DELIVERED', 'statsDelivered', 1000 + Math.random() * 2000);

                    // b) Delivered -> Read (Random chance)
                    if (Math.random() > 0.3) { // 70% read rate
                        await this._simulateStatusChange(recipient.id, campaignId, 'READ', 'statsRead', 3000 + Math.random() * 5000);

                        // c) Read -> Replied (Low chance)
                        if (Math.random() > 0.8) { // 20% reply rate of readers
                            await this._simulateStatusChange(recipient.id, campaignId, 'REPLIED', 'statsReplied', 5000 + Math.random() * 10000);
                        }
                    }
                }
            }));

            // Wait before next batch of "Sending"
            await new Promise(r => setTimeout(r, delayBetweenBatches));
        }

        // Mark campaign as COMPLETED
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' }
        });

        console.log(`[MockService] Simulation completed for campaign ${campaignId}`);
        this.activeSimulations.delete(campaignId);
    }

    async _simulateStatusChange(recipientId, campaignId, status, statField, delayMs) {
        await new Promise(r => setTimeout(r, delayMs));

        try {
            await prisma.$transaction([
                prisma.campaignRecipient.update({
                    where: { id: recipientId },
                    data: {
                        status: status,
                        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
                        ...(status === 'READ' ? { readAt: new Date() } : {}),
                        ...(status === 'REPLIED' ? { replied: true } : {})
                    }
                }),
                prisma.campaign.update({
                    where: { id: campaignId },
                    data: { [statField]: { increment: 1 } }
                })
            ]);
        } catch (e) {
            // Ignore if record missing or other specific errors during simulation
        }
    }
}

module.exports = new MockService();
