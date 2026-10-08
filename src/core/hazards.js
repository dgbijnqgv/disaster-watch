// Fixed reference data about hazards: threat levels, hazard types and what people should do.
// This is guidance, not situation-dependent content: every event itself comes from the live feeds.

export const LEVELS = [
  { id: 0, name: 'None', color: '#8a94a6', blurb: '' },
  { id: 1, name: 'Low', color: '#2e9e5b', blurb: 'Minor event. Stay informed.' },
  { id: 2, name: 'Moderate', color: '#d9a400', blurb: 'Could disrupt daily life. Review your plan and supplies.' },
  { id: 3, name: 'High', color: '#ea6a1f', blurb: 'Dangerous. Be ready to act and follow official orders.' },
  { id: 4, name: 'Extreme', color: '#d7263d', blurb: 'Life-threatening. Act immediately on official instructions.' },
];

export const TYPES = {
  earthquake: { label: 'Earthquake' },
  wildfire: { label: 'Wildfire' },
  storm: { label: 'Hurricane / Cyclone' },
  flood: { label: 'Flood' },
  volcano: { label: 'Volcano' },
  severe: { label: 'Severe weather' },
  tsunami: { label: 'Tsunami' },
  heat: { label: 'Extreme heat' },
  winter: { label: 'Winter storm' },
  drought: { label: 'Drought' },
  other: { label: 'Other hazard' },
};

// What to do, by hazard:
//   ready  - preparation, before anything threatens you
//   now    - it is here and serious: act
//   near   - it is close and could reach you: get ready to act
//   urgent - the signs that mean "stop preparing and act now"
export const PREP = {
  earthquake: {
    ready: ['Secure heavy furniture, TVs and the water heater to walls', 'Practise Drop, Cover, Hold On with your household', 'Keep shoes, a flashlight and a whistle by your bed', 'Store at least 3 days of water (4 L per person per day) and food'],
    now: ['Drop, Cover, Hold On — get under a sturdy table, away from windows', 'Outdoors: move away from buildings, trees and power lines', 'On the coast after strong or long shaking: go to high ground now (tsunami risk)', 'Expect aftershocks. Check for gas leaks and do not use elevators'],
    near: ['Expect aftershocks for days. When one hits: Drop, Cover, Hold On', 'Check for gas smells, damaged wiring and cracks. Leave a damaged building', 'On the coast after strong or long shaking: go to high ground now', 'Text instead of calling, so phone lines stay free for emergencies'],
    urgent: 'If you smell gas, turn off the main valve if you can, leave the building and call emergency services from outside.',
  },
  wildfire: {
    ready: ['Pack a go-bag: medicines, documents, chargers, N95 masks, water', 'Clear dry leaves and debris 1.5 m (5 ft) around your home', 'Know two ways out of your neighbourhood', 'Sign up for local emergency alerts'],
    now: ['If told to evacuate, leave immediately — do not wait', 'Keep your car fuelled and parked facing out', 'Heavy smoke: stay indoors, close windows, run filtered air; wear an N95 outside', 'Report new fires to emergency services (911 / 112)'],
    near: ['Put your go-bag, medicines and documents in the car now', 'Check your local fire agency for evacuation zones and orders', 'Close all windows, doors and vents to keep out smoke and embers', 'Decide where you will go: friends outside the area or a public shelter', 'Keep pets indoors so you can leave quickly'],
    urgent: 'Leave at once if you are told to evacuate, smoke gets thick, or ash and embers start falling.',
  },
  storm: {
    ready: ['Find out if you are in an evacuation zone and plan your route', 'Stock 3–7 days of water, food, medicines, batteries and cash', 'Fill the car, charge power banks, secure outdoor items', 'Put documents in a waterproof bag'],
    now: ['Follow evacuation orders without delay', 'Shelter in a small interior room away from windows, on the lowest floor that will not flood', 'Never walk or drive through floodwater', 'Never run a generator indoors (carbon monoxide)', 'If the eye passes over, stay put — the winds return'],
    near: ['Check whether your area has an evacuation order and plan your route', 'Bring in outdoor furniture; close shutters or board up windows', 'Fill containers with drinking water; charge phones and power banks', 'Refuel the car and take out some cash', 'In a mobile home or flood-prone area, move somewhere safer before the winds arrive'],
    urgent: 'Leave at once if you are told to evacuate or water starts rising around your home.',
  },
  flood: {
    ready: ['Check whether your home is in a flood zone', 'Move valuables and documents to a higher floor', 'Clear drains and gutters; prepare a go-bag', 'Know the route to higher ground'],
    now: ['Move to higher ground now', 'Turn around, don’t drown: 15 cm of moving water can knock you down, 30 cm can float a car', 'Avoid touching floodwater (sewage, debris, live wires)', 'Switch off power at the main breaker if it is safe to do so'],
    near: ['Follow local flood warnings: water can rise within minutes', 'Move valuables, documents and medicines upstairs', 'Move your car to higher ground', 'Avoid low roads, underpasses and riverbanks', 'Keep your go-bag by the door so you can leave quickly'],
    urgent: 'Go to higher ground at once if water reaches your street or a river rises quickly.',
  },
  volcano: {
    ready: ['Learn the local hazard zones and evacuation routes', 'Keep N95 masks and goggles for ash', 'Store drinking water — ash contaminates supplies'],
    now: ['Evacuate if ordered', 'Stay indoors with windows and vents closed', 'Outside, wear an N95 mask and goggles; avoid driving in heavy ash', 'Keep away from river valleys (mudflows / lahars)'],
    near: ['Follow the local volcano observatory and civil protection updates', 'Keep N95 masks and goggles at hand for ash', 'Cover water tanks and protect electronics from ash', 'Stay out of valleys and river channels below the volcano'],
    urgent: 'Leave at once if you are told to evacuate or hear of mudflows (lahars) heading your way.',
  },
  severe: {
    ready: ['Pick a safe room: basement or windowless interior room on the lowest floor', 'Turn on emergency alerts on your phone', 'Bring in or tie down loose outdoor items'],
    now: ['Tornado warning: go to your safe room now and protect your head', 'Lightning: get indoors; avoid water and corded electronics', 'Stay away from windows', 'Mobile homes are not safe — move to a sturdy building'],
    near: ['Keep phone alerts on and know where your safe room is', 'Bring in or tie down loose items outdoors', 'Postpone outdoor plans and long drives', 'Charge your phone and keep a flashlight ready'],
    urgent: 'Go to your safe room at once if you hear a roar like a train, see a rotating cloud, or a tornado warning is issued.',
  },
  tsunami: {
    ready: ['Learn tsunami evacuation routes if you live or stay near the coast', 'Know the natural warning signs: strong shaking, sudden sea retreat, loud roar'],
    now: ['Go to high ground or far inland immediately — do not wait for official confirmation', 'Stay away from the coast until officials give the all-clear', 'More than one wave will come'],
    near: ['Know the way to high ground or at least 3 km (2 miles) inland', 'Stay away from beaches, harbours and river mouths', 'Listen for official tsunami warnings'],
    urgent: 'Go to high ground at once if the ground shakes strongly, the sea pulls back, or you hear a roar from the ocean.',
  },
  heat: {
    ready: ['Plan where you can go to cool off (air-conditioned public spaces)', 'Check on elderly neighbours and relatives'],
    now: ['Stay in air conditioning and drink water regularly', 'Avoid strenuous activity 11:00–16:00', 'Never leave children or pets in a parked car', 'Confusion or hot, dry skin = heat stroke: call 911 / 112'],
    near: ['Plan your day around the cooler morning and evening hours', 'Drink water before you feel thirsty', 'Keep blinds closed during the day', 'Check on older neighbours, babies and people who live alone'],
    urgent: 'Call emergency services if someone becomes confused, stops sweating or faints.',
  },
  winter: {
    ready: ['Stock food, water, medicines and a way to stay warm without power', 'Winterise the car: blanket, scraper, charged phone'],
    now: ['Avoid travel if you can', 'Dress in layers; watch for frostbite and hypothermia', 'Never heat your home with a grill or generator indoors', 'Let taps drip to prevent frozen pipes'],
    near: ['Stock food, water and medicines for several days', 'Charge phones and keep blankets and a flashlight ready', 'Avoid travel; if you must drive, carry a winter kit', 'Protect pipes from freezing'],
    urgent: 'If the power fails in freezing weather and you cannot stay warm, go to a warming centre or a friend’s home.',
  },
  drought: {
    ready: ['Conserve water and fix leaks', 'Wildfire risk rises in drought — keep your go-bag ready'],
    now: ['Follow local water restrictions', 'Stay hydrated and check on vulnerable people'],
    near: ['Follow water-saving rules', 'Avoid anything outdoors that could start a fire', 'Keep your go-bag ready in case wildfires break out'],
    urgent: 'Report any new fire to emergency services at once.',
  },
  other: {
    ready: ['Keep your phone charged and emergency alerts on', 'Know how to reach local emergency services'],
    now: ['Follow instructions from local authorities', 'Stay informed through official channels'],
    near: ['Follow updates from local authorities', 'Charge your phone and keep alerts on', 'Keep your go-bag ready'],
    urgent: 'Follow any order from local authorities at once.',
  },
};

export const GO_BAG = [
  'Water — 4 L per person per day, for 3 days',
  'Non-perishable food for 3 days',
  'Prescription medicines and glasses',
  'First-aid kit',
  'Flashlight and spare batteries',
  'Phone charger and power bank',
  'Copies of ID, insurance and bank documents',
  'Some cash',
  'N95 masks',
  'Whistle to signal for help',
  'Change of clothes and sturdy shoes',
  'Pet food and supplies',
];

// How far from an event people are likely to feel its effects (km). Rough, deliberately generous rules of thumb.
export function impactRadiusKm(e) {
  switch (e.type) {
    case 'earthquake': return Math.min(1200, 20 * 2.2 ** (Math.max(e.mag ?? 3, 3) - 3));
    case 'storm': return [100, 250, 400, 600, 800][e.level];
    case 'wildfire': return [20, 30, 50, 80, 120][e.level];
    case 'flood': return [30, 50, 80, 150, 250][e.level];
    case 'volcano': return [20, 30, 80, 150, 300][e.level];
    case 'tsunami': return 1000;
    case 'drought': return 300;
    default: return 50;
  }
}
