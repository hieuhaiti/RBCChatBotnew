// Extract entities from message
function extractEntities(message, schemaFields) {
    const lowerMessage = message.toLowerCase().trim();
    const entities = {};

    schemaFields.forEach(field => {
        if (field.name === 'name') {
            const nameMatch = lowerMessage.match(/^(?!tôi khỏe|tôi cần|hỗ trợ tôi|tôi muốn|xin chào|alo ạ)([a-zA-Z\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]{1,50})$/i);
            const introNameMatch = lowerMessage.match(/tôi là ([a-zA-Z\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]{1,50})/i);
            entities.name = nameMatch ? message.trim() : (introNameMatch ? introNameMatch[1].trim() : '');
        } else if (field.name === 'phone') {
            const phoneMatch = lowerMessage.match(/0\d{9,10}/);
            entities.phone = phoneMatch ? phoneMatch[0] : '';
        } else if (field.name === 'area') {
            const areaMatch = lowerMessage.match(/(\d+)\s*(m2|m²|met)/i);
            entities.area = areaMatch ? `${areaMatch[1]}m²` : '';
        } else if (field.name === 'budget') {
            const budgetMatch = lowerMessage.match(/(\d+)\s*(tỷ|triệu)/i);
            entities.budget = budgetMatch ? (budgetMatch[2].toLowerCase() === 'tỷ' ? Number(budgetMatch[1]) * 1000 : Number(budgetMatch[1])) : 0;
        } else if (field.name === 'project') {
            const projects = ['nhà ở', 'căn hộ', 'biệt thự', 'nhà phố'];
            entities.project = projects.find(p => lowerMessage.includes(p)) || '';
        } else if (field.name === 'style') {
            const styles = ['hiện đại', 'tối giản', 'cổ điển'];
            entities.style = styles.find(s => lowerMessage.includes(s)) || '';
        }
    });

    return entities;
}

function updatedEntities(entities, facebookName) {
    return {
        ...entities,
        name: facebookName,
        lastInteraction: new Date().toISOString(),
    };
}
module.exports = {
    extractEntities,
    updatedEntities,
};