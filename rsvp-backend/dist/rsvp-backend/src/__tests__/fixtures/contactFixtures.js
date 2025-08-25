"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvWithSpecialCharacters = exports.emptyCSVContent = exports.malformedCSVContent = exports.invalidCSVContent = exports.sampleCSVContent = exports.mockInvalidContacts = exports.mockContactsWithFormattedPhones = exports.mockContacts = void 0;
exports.mockContacts = [
    {
        id: 'contact-1',
        name: 'John Doe',
        phoneNumbers: ['+1234567890', '+1234567891'],
        emails: ['john.doe@example.com', 'john@personal.com']
    },
    {
        id: 'contact-2',
        name: 'Jane Smith',
        phoneNumbers: ['+0987654321'],
        emails: ['jane.smith@example.com']
    },
    {
        id: 'contact-3',
        name: 'Bob Johnson',
        phoneNumbers: ['+1122334455', '(555) 123-4567'],
        emails: []
    },
    {
        id: 'contact-4',
        name: 'Alice Brown',
        phoneNumbers: ['+44 20 7946 0958'],
        emails: ['alice.brown@uk.example.com']
    },
    {
        id: 'contact-5',
        name: 'Charlie Wilson',
        phoneNumbers: [],
        emails: ['charlie@example.com'] // Contact without phone number
    }
];
exports.mockContactsWithFormattedPhones = [
    {
        id: 'contact-formatted-1',
        name: 'David Miller',
        phoneNumbers: ['(123) 456-7890'],
        emails: ['david@example.com']
    },
    {
        id: 'contact-formatted-2',
        name: 'Emma Davis',
        phoneNumbers: ['+1-987-654-3210'],
        emails: ['emma@example.com']
    },
    {
        id: 'contact-formatted-3',
        name: 'Frank Garcia',
        phoneNumbers: ['555.123.4567'],
        emails: ['frank@example.com']
    }
];
exports.mockInvalidContacts = [
    {
        id: 'invalid-1',
        name: '', // Missing name
        phoneNumbers: ['+1234567890'],
        emails: ['test@example.com']
    },
    {
        id: 'invalid-2',
        name: 'Valid Name',
        phoneNumbers: [], // Missing phone numbers
        emails: ['test@example.com']
    }
];
exports.sampleCSVContent = `name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests
John Doe,+1234567890,Vegetarian,1,Friend,bride,Needs wheelchair access
Jane Smith,+0987654321,"Gluten-free,Vegan",0,Cousin,groom,
Bob Johnson,+1122334455,,2,Uncle,bride,Prefers front table
Alice Brown,+5566778899,Lactose intolerant,1,Aunt,groom,Arriving late due to flight
Charlie Wilson,+9988776655,"Nut allergy,Vegetarian",0,Colleague,bride,
Diana Davis,+3344556677,,3,Sibling,groom,Will help with setup`;
exports.invalidCSVContent = `name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests
,+1234567890,Vegetarian,1,Friend,bride,Missing name
John Doe,,Vegetarian,1,Friend,bride,Missing phone
Jane Smith,+0987654321,Vegetarian,invalid,Cousin,groom,Invalid additional guest count
Bob Johnson,+1122334455,Vegetarian,1,InvalidRelationship,bride,Invalid relationship type
Alice Brown,+5566778899,Vegetarian,1,Friend,invalid_side,Invalid bride/groom side`;
exports.malformedCSVContent = 'This is not a proper CSV file structure';
exports.emptyCSVContent = 'name,phoneNumber\n'; // Header only
exports.csvWithSpecialCharacters = `name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests
"José García",+1234567890,"Vegetarian, No spicy food",1,Friend,bride,"Needs Spanish translator"
"李小明",+0987654321,Vegetarian,0,Cousin,groom,"Prefers Chinese menu"
"François Dubois",+1122334455,"Gluten-free, Dairy-free",2,Uncle,bride,"Speaks French only"`;
//# sourceMappingURL=contactFixtures.js.map