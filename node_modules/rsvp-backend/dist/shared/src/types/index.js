"use strict";
// Core data types shared between mobile and web
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipType = void 0;
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["BRIDE"] = "Bride";
    RelationshipType["GROOM"] = "Groom";
    RelationshipType["PARENT"] = "Parent";
    RelationshipType["SIBLING"] = "Sibling";
    RelationshipType["GRANDPARENT"] = "Grandparent";
    RelationshipType["GRANDUNCLE"] = "Granduncle";
    RelationshipType["GRANDAUNT"] = "Grandaunt";
    RelationshipType["UNCLE"] = "Uncle";
    RelationshipType["AUNT"] = "Aunt";
    RelationshipType["COUSIN"] = "Cousin";
    RelationshipType["COLLEAGUE"] = "Colleague";
    RelationshipType["FRIEND"] = "Friend";
    RelationshipType["OTHER"] = "Other";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
// Export invitation types
__exportStar(require("./invitation"), exports);
//# sourceMappingURL=index.js.map