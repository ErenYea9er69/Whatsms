const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * API Client for WhatsSMS Backend
 */
class ApiClient {
    constructor() {
        this.baseUrl = API_URL;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getToken() {
        return this.token;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers,
        };

        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            config.body = JSON.stringify(options.body);
        }

        // For FormData, don't set Content-Type (browser sets it with boundary)
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        const response = await fetch(url, config);

        // Handle 401 - token expired
        // Don't auto-logout if we're just trying to log in and got wrong credentials
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
            this.setToken(null);
            window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
        }

        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error('API Error:', e, 'Response was not JSON:', text);
            throw new Error(`Server Error (${response.status}): Please check browser console for details.`);
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || 'An error occurred');
        }

        return data;
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // Auth
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { username, password },
        });
        this.setToken(data.token);
        return data;
    }

    async register(username, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: { username, password },
        });
        this.setToken(data.token);
        return data;
    }

    async getMe() {
        return this.request('/auth/me');
    }

    logout() {
        this.setToken(null);
    }

    // Contacts
    async getContacts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/contacts${query ? `?${query}` : ''}`);
    }

    async getContactStats() {
        return this.request('/contacts/stats');
    }

    async getContactTags() {
        return this.request('/contacts/tags');
    }

    async getContact(id) {
        return this.request(`/contacts/${id}`);
    }

    async createContact(data) {
        return this.request('/contacts', {
            method: 'POST',
            body: data,
        });
    }

    async updateContact(id, data) {
        return this.request(`/contacts/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteContact(id) {
        return this.request(`/contacts/${id}`, {
            method: 'DELETE',
        });
    }

    async importContacts(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/contacts/import', {
            method: 'POST',
            body: formData,
        });
    }

    async fetchWhatsAppContacts() {
        return this.request('/contacts/fetch-whatsapp', {
            method: 'POST',
        });
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/upload', {
            method: 'POST',
            body: formData,
        });
    }

    // Lists
    async getLists() {
        return this.request('/lists');
    }

    async getList(id) {
        return this.request(`/lists/${id}`);
    }

    async createList(data) {
        return this.request('/lists', {
            method: 'POST',
            body: data,
        });
    }

    async updateList(id, data) {
        return this.request(`/lists/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteList(id) {
        return this.request(`/lists/${id}`, {
            method: 'DELETE',
        });
    }

    async addContactsToList(listId, contactIds) {
        return this.request(`/lists/${listId}/contacts`, {
            method: 'POST',
            body: { contactIds },
        });
    }

    async removeContactFromList(listId, contactId) {
        return this.request(`/lists/${listId}/contacts/${contactId}`, {
            method: 'DELETE',
        });
    }

    // Campaigns
    async getCampaigns(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/campaigns${query ? `?${query}` : ''}`);
    }

    async getCampaignStats() {
        return this.request('/campaigns/stats');
    }

    async getCampaign(id) {
        return this.request(`/campaigns/${id}`);
    }

    async getCampaignRecipients(id, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/campaigns/${id}/recipients${query ? `?${query}` : ''}`);
    }

    async createCampaign(data) {
        return this.request('/campaigns', {
            method: 'POST',
            body: data,
        });
    }

    async updateCampaign(id, data) {
        return this.request(`/campaigns/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteCampaign(id) {
        return this.request(`/campaigns/${id}`, {
            method: 'DELETE',
        });
    }

    async sendCampaign(id) {
        return this.request(`/campaigns/${id}/send`, {
            method: 'POST',
        });
    }

    async stopCampaign(id) {
        return this.request(`/campaigns/${id}/stop`, {
            method: 'POST',
        });
    }

    // Templates
    async getTemplates() {
        return this.request('/templates');
    }

    async getTemplate(id) {
        return this.request(`/templates/${id}`);
    }

    async createTemplate(data) {
        return this.request('/templates', {
            method: 'POST',
            body: data,
        });
    }

    async updateTemplate(id, data) {
        return this.request(`/templates/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteTemplate(id) {
        return this.request(`/templates/${id}`, {
            method: 'DELETE',
        });
    }

    // Media
    async getMedia(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/media${query ? `?${query}` : ''}`);
    }

    async uploadMedia(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/media/upload', {
            method: 'POST',
            body: formData,
        });
    }

    async deleteMedia(id) {
        return this.request(`/media/${id}`, {
            method: 'DELETE',
        });
    }

    // Team
    async getTeamMembers() {
        return this.request('/team');
    }

    async addTeamMember(data) {
        return this.request('/team', {
            method: 'POST',
            body: data,
        });
    }

    async updateTeamMember(id, data) {
        return this.request(`/team/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteTeamMember(id) {
        return this.request(`/team/${id}`, {
            method: 'DELETE',
        });
    }

    // Conversations
    async getConversations(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/conversations${query ? `?${query}` : ''}`);
    }

    async getConversation(id) {
        return this.request(`/conversations/${id}`);
    }

    async sendMessage(conversationId, data) {
        return this.request(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: data,
        });
    }

    async assignConversation(conversationId, assignedToId) {
        return this.request(`/conversations/${conversationId}/assign`, {
            method: 'PUT',
            body: { assignedToId },
        });
    }

    async updateConversationStatus(conversationId, status) {
        return this.request(`/conversations/${conversationId}/status`, {
            method: 'PUT',
            body: { status },
        });
    }

    // Notes
    async getNotes(contactId) {
        return this.request(`/notes/contact/${contactId}`);
    }

    async addNote(data) {
        return this.request('/notes', {
            method: 'POST',
            body: data,
        });
    }
}

// Export singleton instance
const api = new ApiClient();
export default api;
