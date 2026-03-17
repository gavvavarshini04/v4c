
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envLines = fs.readFileSync('.env', 'utf8').split('\n');
const env = {};
envLines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0]] = parts[1].replace(/"/g, '').trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase.from('complaints').select('id, title, status, latitude, longitude');
    if (error) {
        console.error(error);
        process.exit(1);
    }
    console.log('--- INSPECTION START ---');
    console.log('Total complaints in DB:', data.length);
    data.forEach(c => {
        console.log(`ID: ${c.id.slice(0, 8)}, Status: ${c.status}, Lat: ${c.latitude}, Lng: ${c.longitude}`);
    });
    console.log('--- INSPECTION END ---');
    process.exit(0);
}

inspect();
