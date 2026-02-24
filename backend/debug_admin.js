const path = require('path');
const dotenv = require('dotenv');
const paths = [path.join(__dirname, '.env'), path.join(__dirname, '../.env')];
let loaded = false;
for (const p of paths) {
    const r = dotenv.config({ path: p });
    if (!r.error) { console.log('Env loaded from ' + p); loaded = true; break; }
}
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        if (!process.env.MONGO_URI) { console.log('No MONGO_URI'); process.exit(1); }
        await mongoose.connect(process.env.MONGO_URI);
        const admins = await User.find({ role: 'Admin' });
        console.log(`Found ${admins.length} admins.`);
        for (const a of admins) {
            console.log(`Email: ${a.email} | Role: ${a.role}`);
            const m = await bcrypt.compare('blub', a.password);
            console.log(`Password 'blub' match: ${m}`);
        }
        process.exit(0);
    } catch(e) { console.error(e); process.exit(1); }
})();