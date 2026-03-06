const bcrypt = require("bcryptjs");

const hashes = {
    admin: "$2b$10$kCTZYYxJ.hAXu1XBoF1eZeo9jj/SpsP0N2ybVv5UU4wdN/hP7h3ei",
    company1: "$2b$10$C6fKXrUfK1TRH49fXZOIJ.bk./gvJo2PhfZ3eiCzhrjv.JjwfV/YS",
    school1: "$2b$10$5/QMMpaMJHVdJKFAReEFQuUmjd9XsS/.1cUZkJWNhr./q/n3s/xgC"
};

const passwords = {
    admin: "admin123",
    company1: "staff123",
    school1: "school123"
};

async function test() {
    for (const [key, hash] of Object.entries(hashes)) {
        const isValid = await bcrypt.compare(passwords[key], hash);
        console.log(`${key} password ("${passwords[key]}") is valid: ${isValid}`);
    }
}

test();
