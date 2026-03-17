// Rule-based civic analysis utilities - No external API needed
// Useful for auto-categorizing complaints and basic chatbot matching

export interface AIAnalysis {
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    department: string;
}

const CATEGORY_MAP: [RegExp, string][] = [
    [/pothole|road|pavement|bridge|footpath|highway/i, 'road_infrastructure'],
    [/water|pipeline|tap|drain|sewage|leaking pipe/i, 'water_supply'],
    [/electric|light|pole|wire|streetlight|power cut|transformer/i, 'electricity'],
    [/garbage|waste|trash|litter|dumping|rubbish/i, 'waste_management'],
    [/safety|crime|accident|fire|violence|theft/i, 'public_safety'],
];

const DEPT_MAP: Record<string, string> = {
    road_infrastructure: 'Roads & Infrastructure Dept.',
    water_supply: 'Water Supply Dept.',
    electricity: 'Electricity Dept.',
    waste_management: 'Waste Management Dept.',
    public_safety: 'Public Safety Dept.',
    other: 'General Administration',
};

export function analyzeComplaintLocally(description: string): AIAnalysis {
    let category = 'other';
    for (const [regex, cat] of CATEGORY_MAP) {
        if (regex.test(description)) { category = cat; break; }
    }

    let priority: AIAnalysis['priority'] = 'medium';
    if (/critical|emergency|danger|collapse|gas leak|flood|open wire|electric wire/i.test(description)) priority = 'critical';
    else if (/urgent|broken|leaking|fallen|open drain|accident|fire/i.test(description)) priority = 'high';
    else if (/minor|small|slight|little|suggestion/i.test(description)) priority = 'low';

    return {
        category,
        priority,
        summary: description.slice(0, 70).replace(/\s+\S*$/, '…'),
        department: DEPT_MAP[category] || DEPT_MAP.other,
    };
}
