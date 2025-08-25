const fs = require('fs');
const path = require('path');

// Read the current mock data
const mockDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

// New comprehensive guest data with all relationship types
const newGuests = [
  {
    "id": "bride-1",
    "eventId": "demo-event-1",
    "name": "Sarah Williams",
    "phoneNumber": "60123456700",
    "dietaryRestrictions": [],
    "additionalGuestCount": 0,
    "relationshipType": "Bride",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "VIP table",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:00:00Z",
    "updatedAt": "2025-07-01T09:00:00Z"
  },
  {
    "id": "groom-1",
    "eventId": "demo-event-1",
    "name": "John Thompson",
    "phoneNumber": "60123456701",
    "dietaryRestrictions": [],
    "additionalGuestCount": 0,
    "relationshipType": "Groom",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "VIP table",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:00:00Z",
    "updatedAt": "2025-07-01T09:00:00Z"
  },
  {
    "id": "bride-parent-1",
    "eventId": "demo-event-1",
    "name": "Robert Williams",
    "phoneNumber": "60123456702",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Parent",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Father of the bride",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:05:00Z",
    "updatedAt": "2025-07-01T09:05:00Z"
  },
  {
    "id": "bride-parent-2",
    "eventId": "demo-event-1",
    "name": "Linda Williams",
    "phoneNumber": "60123456703",
    "dietaryRestrictions": ["Vegetarian"],
    "additionalGuestCount": 0,
    "relationshipType": "Parent",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Mother of the bride",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:05:00Z",
    "updatedAt": "2025-07-01T09:05:00Z"
  },
  {
    "id": "groom-parent-1",
    "eventId": "demo-event-1",
    "name": "Michael Thompson",
    "phoneNumber": "60123456704",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Parent",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Father of the groom",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:05:00Z",
    "updatedAt": "2025-07-01T09:05:00Z"
  },
  {
    "id": "groom-parent-2",
    "eventId": "demo-event-1",
    "name": "Patricia Thompson",
    "phoneNumber": "60123456705",
    "dietaryRestrictions": ["Gluten-free"],
    "additionalGuestCount": 0,
    "relationshipType": "Parent",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Mother of the groom",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:05:00Z",
    "updatedAt": "2025-07-01T09:05:00Z"
  },
  {
    "id": "bride-sibling-1",
    "eventId": "demo-event-1",
    "name": "David Williams",
    "phoneNumber": "60123456706",
    "dietaryRestrictions": [],
    "additionalGuestCount": 2,
    "relationshipType": "Sibling",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Brother of the bride",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:10:00Z",
    "updatedAt": "2025-07-01T09:10:00Z"
  },
  {
    "id": "bride-sibling-2",
    "eventId": "demo-event-1",
    "name": "Emily Williams",
    "phoneNumber": "60123456707",
    "dietaryRestrictions": ["Lactose-free"],
    "additionalGuestCount": 1,
    "relationshipType": "Sibling",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Sister of the bride",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:10:00Z",
    "updatedAt": "2025-07-01T09:10:00Z"
  },
  {
    "id": "groom-sibling-1",
    "eventId": "demo-event-1",
    "name": "Daniel Thompson",
    "phoneNumber": "60123456708",
    "dietaryRestrictions": [],
    "additionalGuestCount": 3,
    "relationshipType": "Sibling",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Brother of the groom",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:10:00Z",
    "updatedAt": "2025-07-01T09:10:00Z"
  },
  {
    "id": "bride-grandparent-1",
    "eventId": "demo-event-1",
    "name": "George Williams",
    "phoneNumber": "60123456709",
    "dietaryRestrictions": ["Soft foods"],
    "additionalGuestCount": 1,
    "relationshipType": "Grandparent",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Wheelchair accessible, close to restrooms",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:15:00Z",
    "updatedAt": "2025-07-01T09:15:00Z"
  },
  {
    "id": "bride-grandparent-2",
    "eventId": "demo-event-1",
    "name": "Margaret Williams",
    "phoneNumber": "60123456710",
    "dietaryRestrictions": ["Diabetic-friendly"],
    "additionalGuestCount": 0,
    "relationshipType": "Grandparent",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Quiet seating preferred",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:15:00Z",
    "updatedAt": "2025-07-01T09:15:00Z"
  },
  {
    "id": "groom-grandparent-1",
    "eventId": "demo-event-1",
    "name": "William Thompson",
    "phoneNumber": "60123456711",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Grandparent",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Close to family table",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:15:00Z",
    "updatedAt": "2025-07-01T09:15:00Z"
  },
  {
    "id": "bride-granduncle-1",
    "eventId": "demo-event-1",
    "name": "Charles Williams",
    "phoneNumber": "60123456712",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Granduncle",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Enjoys storytelling",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:20:00Z",
    "updatedAt": "2025-07-01T09:20:00Z"
  },
  {
    "id": "bride-grandaunt-1",
    "eventId": "demo-event-1",
    "name": "Dorothy Williams",
    "phoneNumber": "60123456713",
    "dietaryRestrictions": ["Vegetarian"],
    "additionalGuestCount": 0,
    "relationshipType": "Grandaunt",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Loves dancing",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:20:00Z",
    "updatedAt": "2025-07-01T09:20:00Z"
  },
  {
    "id": "groom-granduncle-1",
    "eventId": "demo-event-1",
    "name": "Frank Thompson",
    "phoneNumber": "60123456714",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Granduncle",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Veteran, prefers quiet area",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:20:00Z",
    "updatedAt": "2025-07-01T09:20:00Z"
  },
  {
    "id": "bride-uncle-1",
    "eventId": "demo-event-1",
    "name": "Michael Williams",
    "phoneNumber": "60123456715",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Uncle",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Photographer, needs good view",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:25:00Z",
    "updatedAt": "2025-07-01T09:25:00Z"
  },
  {
    "id": "bride-aunt-1",
    "eventId": "demo-event-1",
    "name": "Susan Williams",
    "phoneNumber": "60123456716",
    "dietaryRestrictions": ["Gluten-free"],
    "additionalGuestCount": 0,
    "relationshipType": "Aunt",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Event coordinator, may need to move around",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:25:00Z",
    "updatedAt": "2025-07-01T09:25:00Z"
  },
  {
    "id": "groom-uncle-1",
    "eventId": "demo-event-1",
    "name": "James Thompson",
    "phoneNumber": "60123456717",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Uncle",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Best man's speech coordinator",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:25:00Z",
    "updatedAt": "2025-07-01T09:25:00Z"
  },
  {
    "id": "groom-aunt-1",
    "eventId": "demo-event-1",
    "name": "Carol Thompson",
    "phoneNumber": "60123456718",
    "dietaryRestrictions": ["Vegan"],
    "additionalGuestCount": 0,
    "relationshipType": "Aunt",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Loves to dance",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:25:00Z",
    "updatedAt": "2025-07-01T09:25:00Z"
  },
  {
    "id": "bride-cousin-1",
    "eventId": "demo-event-1",
    "name": "Jessica Williams",
    "phoneNumber": "60123456719",
    "dietaryRestrictions": [],
    "additionalGuestCount": 2,
    "relationshipType": "Cousin",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Young children, needs high chairs",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:30:00Z",
    "updatedAt": "2025-07-01T09:30:00Z"
  },
  {
    "id": "bride-cousin-2",
    "eventId": "demo-event-1",
    "name": "Mark Williams",
    "phoneNumber": "60123456720",
    "dietaryRestrictions": ["Nut allergy"],
    "additionalGuestCount": 1,
    "relationshipType": "Cousin",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Severe nut allergy - EpiPen required",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:30:00Z",
    "updatedAt": "2025-07-01T09:30:00Z"
  },
  {
    "id": "groom-cousin-1",
    "eventId": "demo-event-1",
    "name": "Lisa Thompson",
    "phoneNumber": "60123456721",
    "dietaryRestrictions": ["Vegetarian"],
    "additionalGuestCount": 0,
    "relationshipType": "Cousin",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Maid of honor's assistant",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:30:00Z",
    "updatedAt": "2025-07-01T09:30:00Z"
  },
  {
    "id": "groom-cousin-2",
    "eventId": "demo-event-1",
    "name": "Robert Thompson",
    "phoneNumber": "60123456722",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Cousin",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Groomsman",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:30:00Z",
    "updatedAt": "2025-07-01T09:30:00Z"
  },
  {
    "id": "bride-colleague-1",
    "eventId": "demo-event-1",
    "name": "Amanda Johnson",
    "phoneNumber": "60123456723",
    "dietaryRestrictions": [],
    "additionalGuestCount": 0,
    "relationshipType": "Colleague",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Work supervisor",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:35:00Z",
    "updatedAt": "2025-07-01T09:35:00Z"
  },
  {
    "id": "bride-colleague-2",
    "eventId": "demo-event-1",
    "name": "Kevin Martinez",
    "phoneNumber": "60123456724",
    "dietaryRestrictions": ["Lactose-free"],
    "additionalGuestCount": 1,
    "relationshipType": "Colleague",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Team lead",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:35:00Z",
    "updatedAt": "2025-07-01T09:35:00Z"
  },
  {
    "id": "groom-colleague-1",
    "eventId": "demo-event-1",
    "name": "Thomas Anderson",
    "phoneNumber": "60123456725",
    "dietaryRestrictions": [],
    "additionalGuestCount": 0,
    "relationshipType": "Colleague",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Business partner",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:35:00Z",
    "updatedAt": "2025-07-01T09:35:00Z"
  },
  {
    "id": "groom-colleague-2",
    "eventId": "demo-event-1",
    "name": "Michael Davis",
    "phoneNumber": "60123456726",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Colleague",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Former boss",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:35:00Z",
    "updatedAt": "2025-07-01T09:35:00Z"
  },
  {
    "id": "bride-friend-1",
    "eventId": "demo-event-1",
    "name": "Jennifer Martinez",
    "phoneNumber": "60123456727",
    "dietaryRestrictions": ["Vegetarian", "Gluten-free"],
    "additionalGuestCount": 1,
    "relationshipType": "Friend",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Maid of honor",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:40:00Z",
    "updatedAt": "2025-07-01T09:40:00Z"
  },
  {
    "id": "bride-friend-2",
    "eventId": "demo-event-1",
    "name": "Sarah Johnson",
    "phoneNumber": "60123456728",
    "dietaryRestrictions": [],
    "additionalGuestCount": 0,
    "relationshipType": "Friend",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "College roommate",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:40:00Z",
    "updatedAt": "2025-07-01T09:40:00Z"
  },
  {
    "id": "bride-friend-3",
    "eventId": "demo-event-1",
    "name": "Emily Davis",
    "phoneNumber": "60123456729",
    "dietaryRestrictions": ["Gluten-free"],
    "additionalGuestCount": 0,
    "relationshipType": "Friend",
    "brideOrGroomSide": "bride",
    "rsvpStatus": "accepted",
    "specialRequests": "Bridesmaid",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:40:00Z",
    "updatedAt": "2025-07-01T09:40:00Z"
  },
  {
    "id": "groom-friend-1",
    "eventId": "demo-event-1",
    "name": "Christopher Lee",
    "phoneNumber": "60123456730",
    "dietaryRestrictions": [],
    "additionalGuestCount": 0,
    "relationshipType": "Friend",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Best man",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:40:00Z",
    "updatedAt": "2025-07-01T09:40:00Z"
  },
  {
    "id": "groom-friend-2",
    "eventId": "demo-event-1",
    "name": "Robert Wilson",
    "phoneNumber": "60123456731",
    "dietaryRestrictions": [],
    "additionalGuestCount": 1,
    "relationshipType": "Friend",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "College buddy",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:40:00Z",
    "updatedAt": "2025-07-01T09:40:00Z"
  },
  {
    "id": "groom-friend-3",
    "eventId": "demo-event-1",
    "name": "David Brown",
    "phoneNumber": "60123456732",
    "dietaryRestrictions": [],
    "additionalGuestCount": 2,
    "relationshipType": "Friend",
    "brideOrGroomSide": "groom",
    "rsvpStatus": "accepted",
    "specialRequests": "Groomsman",
    "tableAssignment": null,
    "createdAt": "2025-07-01T09:40:00Z",
    "updatedAt": "2025-07-01T09:40:00Z"
  }
];

// Update the mock data with new guests
mockData.guests = newGuests;

// Also update the tables to use the new table structure
mockData.tables = [
  {
    "id": "table-1",
    "eventId": "demo-event-1",
    "name": "Table 1 - VIP",
    "capacity": 10,
    "position": {
      "x": 200,
      "y": 150
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:00:00Z",
    "updatedAt": "2025-07-01T12:00:00Z"
  },
  {
    "id": "table-2",
    "eventId": "demo-event-1",
    "name": "Table 2 - Immediate Family",
    "capacity": 8,
    "position": {
      "x": 100,
      "y": 200
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:05:00Z",
    "updatedAt": "2025-07-01T12:05:00Z"
  },
  {
    "id": "table-3",
    "eventId": "demo-event-1",
    "name": "Table 3 - Immediate Family",
    "capacity": 8,
    "position": {
      "x": 300,
      "y": 200
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:10:00Z",
    "updatedAt": "2025-07-01T12:10:00Z"
  },
  {
    "id": "table-4",
    "eventId": "demo-event-1",
    "name": "Table 4 - Extended Family",
    "capacity": 10,
    "position": {
      "x": 50,
      "y": 300
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:15:00Z",
    "updatedAt": "2025-07-02T14:20:00Z"
  },
  {
    "id": "table-5",
    "eventId": "demo-event-1",
    "name": "Table 5 - Extended Family",
    "capacity": 10,
    "position": {
      "x": 200,
      "y": 300
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:20:00Z",
    "updatedAt": "2025-07-01T12:20:00Z"
  },
  {
    "id": "table-6",
    "eventId": "demo-event-1",
    "name": "Table 6 - Extended Family",
    "capacity": 10,
    "position": {
      "x": 350,
      "y": 300
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:25:00Z",
    "updatedAt": "2025-07-01T12:25:00Z"
  },
  {
    "id": "table-7",
    "eventId": "demo-event-1",
    "name": "Table 7 - Friends",
    "capacity": 8,
    "position": {
      "x": 100,
      "y": 400
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:30:00Z",
    "updatedAt": "2025-07-01T12:30:00Z"
  },
  {
    "id": "table-8",
    "eventId": "demo-event-1",
    "name": "Table 8 - Friends",
    "capacity": 8,
    "position": {
      "x": 300,
      "y": 400
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:35:00Z",
    "updatedAt": "2025-07-01T12:35:00Z"
  },
  {
    "id": "table-9",
    "eventId": "demo-event-1",
    "name": "Table 9 - Colleagues",
    "capacity": 6,
    "position": {
      "x": 450,
      "y": 400
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:40:00Z",
    "updatedAt": "2025-07-01T12:40:00Z"
  },
  {
    "id": "table-10",
    "eventId": "demo-event-1",
    "name": "Table 10 - Colleagues",
    "capacity": 6,
    "position": {
      "x": 450,
      "y": 300
    },
    "isLocked": false,
    "assignedGuests": [],
    "createdAt": "2025-07-01T12:45:00Z",
    "updatedAt": "2025-07-01T12:45:00Z"
  }
];

// Write the updated mock data back to the file
fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2));

console.log('✅ Mock data updated successfully!');
console.log(`📊 Updated with ${newGuests.length} guests and ${mockData.tables.length} tables`);
console.log('🎯 All guests have rsvpStatus: "accepted" for testing');