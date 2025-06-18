document.addEventListener('DOMContentLoaded', () => {
    const faqForm = document.getElementById('faqForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const faqTableBody = document.getElementById('faqTableBody');
    let currentFaqId = null; // Track FAQ being edited

    // Load FAQs on page load
    loadFAQs();

    // Handle form submission
    // Handle form submission
faqForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    submitButton.disabled = true;

    const faqData = {
        faqID: currentFaqId || generateUUID(),
        question: document.getElementById('question').value,
        answer: document.getElementById('answer').value,
        pageID: document.getElementById('pageId').value,
        priority: parseInt(document.getElementById('priority').value),
        assistantID: document.getElementById('assistantId').value,
        createdAt: currentFaqId ? undefined : new Date().toISOString()
    };

    try {
        const url = '/api/dynamo/FAQsRBC'; // Always use POST for both create and update
        const response = await fetch(url, {
            method: 'POST', // Use POST for both create and update
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faqData),
        });

        if (response.ok) {
            alert(currentFaqId ? 'FAQ updated successfully' : 'FAQ saved successfully');
            faqForm.reset();
            resetForm();
            loadFAQs();
        } else {
            const error = await response.text(); // Get raw response for debugging
            throw new Error(`Failed to ${currentFaqId ? 'update' : 'save'} FAQ: ${error}`);
        }
    } catch (error) {
        console.error(`Error ${currentFaqId ? 'updating' : 'saving'} FAQ:`, error);
        alert(`Error ${currentFaqId ? 'updating' : 'saving'} FAQ: ${error.message}`);
    } finally {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
});

    // Handle cancel button
    cancelBtn.addEventListener('click', () => {
        resetForm();
    });

    // Load FAQs from backend
    async function loadFAQs() {
        try {
            const response = await fetch('/api/dynamo/scan/FAQsRBC');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to load FAQs`);
            }
            const faqs = await response.json();
            faqTableBody.innerHTML = '';
            faqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            faqs.forEach(faq => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${faq.question}</td>
                    <td>${faq.answer}</td>
                    <td>
                        <button class="edit-btn" data-faqid="${faq.faqID}" data-assistantid="${faq.assistantID}">Sửa</button>
                        <button class="delete-btn" data-faqid="${faq.faqID}" data-assistantid="${faq.assistantID}">Xóa</button>
                    </td>
                `;
                faqTableBody.appendChild(row);
            });

            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', () => editFAQ(button.dataset.faqid));
            });
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', () => deleteFAQ(button.dataset.faqid, button.dataset.assistantid));
            });
        } catch (error) {
            console.error('Error loading FAQs:', error);
            alert(`Error loading FAQs: ${error.message}`);
        }
    }

    // Edit FAQ
    async function editFAQ(faqID) {
    try {
        const assistantID = 'asst_S2VCA6HHZRzb7BBGITjAXMod';
        const response = await fetch(`/api/dynamo/FAQsRBC/${faqID}?assistantID=${encodeURIComponent(assistantID)}`);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const faq = await response.json();
        currentFaqId = faqID;
        document.getElementById('question').value = faq.question || '';
        document.getElementById('answer').value = faq.answer || '';
        document.getElementById('pageId').value = faq.pageID || '381197225080977';
        document.getElementById('priority').value = faq.priority || '1';
        document.getElementById('assistantId').value = faq.assistantID || assistantID;
    } catch (error) {
        console.error('Error fetching FAQ:', error);
        alert(`Error fetching FAQ: ${error.message}`);
    }
}
    // Delete FAQ
    async function deleteFAQ(faqID, assistantID) {
        if (confirm('Are you sure you want to delete this FAQ?')) {
            try {
                const response = await fetch('/api/dynamo/FAQsRBC', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ faqID, assistantID }),
                });
                if (!response.ok) {
                    const error = await response.json();
                    console.error('Delete FAQ response:', error);
                    throw new Error(`HTTP ${response.status}: ${error.message || 'Failed to delete FAQ'}`);
                }
                alert('FAQ deleted successfully');
                loadFAQs();
            } catch (error) {
                console.error('Error deleting FAQ:', error);
                alert(`Error deleting FAQ: ${error.message}`);
            }
        }
    }

    // Reset form and clear currentFaqId
    function resetForm() {
        faqForm.reset();
        document.getElementById('pageId').value = '381197225080977';
        document.getElementById('priority').value = '1';
        document.getElementById('assistantId').value = 'asst_S2VCA6HHZRzb7BBGITjAXMod';
        currentFaqId = null;
    }

    // Generate UUID (simplified, use uuid library in production)
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});