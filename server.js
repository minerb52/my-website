const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'orders.db');

app.use(express.json());
app.use(express.static(__dirname));

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

app.post('/api/orders', (req,res)=>{
  const {id, status, notes} = req.body || {};
  if(!id) return res.status(400).json({error:'id required'});
  const now = new Date().toISOString();
  db.run(`INSERT OR REPLACE INTO orders (id,status,notes,created_at,updated_at) VALUES (?,?,?,?,?)`, [id, status||'Pending', notes||'', now, now], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({ok:true});
  });
});

app.get('/api/orders/:id', (req,res)=>{
  const id = req.params.id;
  db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'not found'});
    res.json(row);
  });
});

app.get('/api/orders', (req,res)=>{
  db.all(`SELECT * FROM orders ORDER BY updated_at DESC LIMIT 200`, [], (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

app.get('/admin', (req,res)=>{
  res.sendFile(path.join(__dirname,'admin.html'));
});

app.listen(PORT, ()=>{
  console.log('Server listening on', PORT);
});