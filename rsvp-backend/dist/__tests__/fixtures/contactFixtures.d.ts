import { ContactData } from '../../../shared/src/types';
export declare const mockContacts: ContactData[];
export declare const mockContactsWithFormattedPhones: ContactData[];
export declare const mockInvalidContacts: {
    id: string;
    name: string;
    phoneNumbers: string[];
    emails: string[];
}[];
export declare const sampleCSVContent = "name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests\nJohn Doe,+1234567890,Vegetarian,1,Friend,bride,Needs wheelchair access\nJane Smith,+0987654321,\"Gluten-free,Vegan\",0,Cousin,groom,\nBob Johnson,+1122334455,,2,Uncle,bride,Prefers front table\nAlice Brown,+5566778899,Lactose intolerant,1,Aunt,groom,Arriving late due to flight\nCharlie Wilson,+9988776655,\"Nut allergy,Vegetarian\",0,Colleague,bride,\nDiana Davis,+3344556677,,3,Sibling,groom,Will help with setup";
export declare const invalidCSVContent = "name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests\n,+1234567890,Vegetarian,1,Friend,bride,Missing name\nJohn Doe,,Vegetarian,1,Friend,bride,Missing phone\nJane Smith,+0987654321,Vegetarian,invalid,Cousin,groom,Invalid additional guest count\nBob Johnson,+1122334455,Vegetarian,1,InvalidRelationship,bride,Invalid relationship type\nAlice Brown,+5566778899,Vegetarian,1,Friend,invalid_side,Invalid bride/groom side";
export declare const malformedCSVContent = "This is not a proper CSV file structure";
export declare const emptyCSVContent = "name,phoneNumber\n";
export declare const csvWithSpecialCharacters = "name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests\n\"Jos\u00E9 Garc\u00EDa\",+1234567890,\"Vegetarian, No spicy food\",1,Friend,bride,\"Needs Spanish translator\"\n\"\u674E\u5C0F\u660E\",+0987654321,Vegetarian,0,Cousin,groom,\"Prefers Chinese menu\"\n\"Fran\u00E7ois Dubois\",+1122334455,\"Gluten-free, Dairy-free\",2,Uncle,bride,\"Speaks French only\"";
//# sourceMappingURL=contactFixtures.d.ts.map