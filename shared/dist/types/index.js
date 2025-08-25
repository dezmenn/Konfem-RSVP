// Core data types shared between mobile and web
export var RelationshipType;
(function (RelationshipType) {
    RelationshipType["UNCLE"] = "Uncle";
    RelationshipType["AUNT"] = "Aunt";
    RelationshipType["GRANDPARENT"] = "Grandparent";
    RelationshipType["COUSIN"] = "Cousin";
    RelationshipType["FRIEND"] = "Friend";
    RelationshipType["COLLEAGUE"] = "Colleague";
    RelationshipType["SIBLING"] = "Sibling";
    RelationshipType["PARENT"] = "Parent";
    RelationshipType["OTHER"] = "Other";
})(RelationshipType || (RelationshipType = {}));
// Export invitation types
export * from './invitation';
