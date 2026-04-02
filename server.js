const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'orders.db');

app.use(express.json());

// Simple HTTP Basic auth middleware for admin routes
function requireAdmin(req, res, next){
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  // If credentials aren't set, allow in dev but log a warning
  if(!adminUser || !adminPass){
    console.warn('ADMIN_USER / ADMIN_PASS not set — admin endpoints are unprotected');
    return next();
  }

  const auth = req.headers['authorization'];
  if(!auth || !auth.startsWith('Basic ')){
    res.setHeader('WWW-Authenticate','Basic realm="Admin"');
    return res.status(401).send('Authentication required');
  }
  const payload = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [user, pass] = payload.split(':');
  if(user === adminUser && pass === adminPass) return next();
  res.setHeader('WWW-Authenticate','Basic realm="Admin"');
  return res.status(403).send('Forbidden');
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    status TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT
  )`);
});

// Admin-protected: create/update order
app.post('/api/orders', requireAdmin, (req,res)=>{
  const {id, status, notes, created_at} = req.body || {};
  if(!id) return res.status(400).json({error:'id required'});
  const now = new Date().toISOString();
  const created = created_at || now;
  db.run(`INSERT OR REPLACE INTO orders (id,status,notes,created_at,updated_at) VALUES (?,?,?,?,?)`, [id, status||'Pending', notes||'', created, now], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({ok:true});
  });
});

// Public: get order by id (used by customers)
app.get('/api/orders/:id', (req,res)=>{
  const id = req.params.id;
  db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'not found'});
    res.json(row);
  });
});

// Admin-protected: list orders
app.get('/api/orders', requireAdmin, (req,res)=>{
  db.all(`SELECT * FROM orders ORDER BY updated_at DESC LIMIT 200`, [], (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// Admin-protected: delete an order
app.delete('/api/orders/:id', requireAdmin, (req,res)=>{
  const id = req.params.id;
  db.run(`DELETE FROM orders WHERE id = ?`, [id], function(err){
    if(err) return res.status(500).json({error:err.message});
    if(this.changes === 0) return res.status(404).json({error:'not found'});
    res.json({ok:true});
  });
});

// Admin UI is protected
app.get('/admin', requireAdmin, (req,res)=>{
  res.sendFile(path.join(__dirname,'admin.html'));
});

// Serve static files (after admin route to ensure /admin is protected)
app.use(express.static(__dirname));

app.listen(PORT, ()=>{
  console.log('Server listening on', PORT);
});