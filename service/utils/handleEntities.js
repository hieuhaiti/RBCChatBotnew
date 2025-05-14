// Extract entities from message
function extractEntities(message = '', schemaFields = []) {
    const lowerMessage = message.toLowerCase().trim();
    const entities = {};

    schemaFields.forEach(field => {
        switch (field.name) {
            case 'name': {
                const introNameMatch = lowerMessage.match(/(?:tôi tên là|tôi là)\s+([a-zA-ZÀ-ỹ\s]{2,50})/i);
                entities.name = introNameMatch ? capitalizeName(introNameMatch[1]) : '';
                break;
            }
            case 'phone': {
                const phoneMatch = lowerMessage.match(/0[0-9]{9,10}/);
                entities.phone = phoneMatch ? phoneMatch[0] : '';
                break;
            }
            case 'area': {
                const areaMatch = lowerMessage.match(/(\d+)\s*(m2|m²|met|mét)/i);
                entities.area = areaMatch ? `${areaMatch[1]}m²` : '';
                break;
            }
            case 'budget': {
                const budgetMatch = lowerMessage.match(/(\d+)\s*(tỷ|triệu)/i);
                if (budgetMatch) {
                    const value = Number(budgetMatch[1]);
                    entities.budget = budgetMatch[2].toLowerCase() === 'tỷ' ? value * 1000 : value;
                } else {
                    entities.budget = 0;
                }
                break;
            }
            case 'project': {
                const projects = ['nhà ở', 'căn hộ', 'biệt thự', 'nhà phố'];
                entities.project = projects.find(p => lowerMessage.includes(p)) || '';
                break;
            }
            case 'style': {
                const styles = ['hiện đại', 'tối giản', 'cổ điển'];
                entities.style = styles.find(s => lowerMessage.includes(s)) || '';
                break;
            }
        }
    });

    return entities;
}

function updatedEntities(entities, name) {
    return {
        ...entities,
        name: capitalizeName(name),
        lastInteraction: new Date().toISOString(),
    };
}

function capitalizeName(name = '') {
    return name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

module.exports = {
    extractEntities,
    updatedEntities,
};
