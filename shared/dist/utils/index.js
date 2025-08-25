// Shared utility functions
export var formatPhoneNumber = function (phone) {
    // Remove all non-digit characters
    var cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
        return "(".concat(cleaned.slice(0, 3), ") ").concat(cleaned.slice(3, 6), "-").concat(cleaned.slice(6));
    }
    return phone; // Return original if not a standard format
};
export var validateEmail = function (email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export var formatDate = function (date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};
export var generateId = function () {
    return Math.random().toString(36).substr(2, 9);
};
