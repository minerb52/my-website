async function apiFetch(url, opts){
  try{
    const res = await fetch(url, opts);
    const text = await res.text();
    let data = null;
    try{ data = text ? JSON.parse(text) : null }catch(e){ data = text }
    if(!res.ok){
      const msg = (data && data.error) ? data.error : (res.statusText || 'Request failed');
      throw new Error(msg);
    }
    return data;
  }catch(err){
    console.warn('API fetch failed', err);
    throw err;
  }
}

function renderList(list){
  const container = document.getElementById('orders');
  if(!Array.isArray(list) || list.length===0){ container.innerHTML = '<div class="muted">No orders</div>'; return }
  container.innerHTML = '';
  list.forEach(o=>{
    const el = document.createElement('div');
    el.className = 'order-item';
    const created = o.created_at ? new Date(o.created_at).toLocaleString() : '';
    const updated = o.updated_at ? new Date(o.updated_at).toLocaleString() : '';
    el.innerHTML = `<div style="cursor:pointer"><strong>${o.id}</strong><div class="muted" style="font-size:13px">${o.status} — ${created}${updated? ' (updated '+updated+')':''}</div></div>
                    <div style="display:flex;gap:8px;align-items:center"><span class="muted" style="max-width:220px">${(o.notes||'')}</span><button data-id="${o.id}" class="btn-primary edit-btn">Edit</button><button data-id="${o.id}" class="btn-primary del-btn">Delete</button></div>`;
    container.appendChild(el);
  });
  // attach handlers
  container.querySelectorAll('.edit-btn').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-id');
    fillFormFromList(id);
  }));
  container.querySelectorAll('.del-btn').forEach(b=>b.addEventListener('click', async ()=>{
    const id = b.getAttribute('data-id');
    if(!confirm('Delete order '+id+'?')) return;
    try{
      await apiFetch('/api/orders/' + encodeURIComponent(id), {method:'DELETE'});
      alert('Deleted');
      loadOrders();
    }catch(e){
      // fallback: remove from localStorage
      const list = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
      const idx = list.findIndex(x=>x.id===id);
      if(idx>=0){ list.splice(idx,1); localStorage.setItem('mtv_orders_store', JSON.stringify(list)); alert('Deleted locally'); loadOrders(); }
      else alert('Failed to delete: '+(e && e.message ? e.message : 'Unknown'));
    }
  }));
}

let lastLoadHadServer = false;

async function loadOrders(){
  const container = document.getElementById('orders');
  container.innerHTML = 'Loading...';
  try{
    const list = await apiFetch('/api/orders');
    lastLoadHadServer = true;
    renderList(list);
  }catch(e){
    lastLoadHadServer = false;
    // fallback to localStorage
    const ls = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
    renderList(ls);
  }
}

function fillFormFromList(id){
  // look in server list first (public GET), then local
  fetch('/api/orders/' + encodeURIComponent(id)).then(async res=>{
    if(res.ok){ const o = await res.json(); document.getElementById('a-id').value = o.id; document.getElementById('a-status').value = o.status || ''; document.getElementById('a-notes').value = o.notes || ''; }
    else throw new Error('not found');
  }).catch(()=>{
    const ls = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
    const found = ls.find(x=>x.id===id);
    if(found){ document.getElementById('a-id').value = found.id; document.getElementById('a-status').value = found.status||''; document.getElementById('a-notes').value = found.notes||'' }
  });
}

async function saveOrder(e){
  e.preventDefault();
  const id = document.getElementById('a-id').value.trim();
  const status = document.getElementById('a-status').value.trim();
  const notes = document.getElementById('a-notes').value.trim();
  if(!id) return alert('Order ID required');

  const now = new Date().toISOString();

  // Determine if order exists on server (public GET) to preserve created_at if present
  let existing = null;
  try{
    const res = await fetch('/api/orders/' + encodeURIComponent(id));
    if(res.ok) existing = await res.json();
  }catch(e){ /* server not reachable */ }

  const payload = existing ? {id,status,notes} : {id,status,notes,created_at: now};

  try{
    await apiFetch('/api/orders', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    // remove local copy if present
    const ls = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
    const idx = ls.findIndex(x=>x.id===id);
    if(idx>=0){ ls.splice(idx,1); localStorage.setItem('mtv_orders_store', JSON.stringify(ls)); }
    alert('Saved to server');
    loadOrders();
  }catch(e){
    // fallback save locally
    const list = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
    const now2 = new Date().toISOString();
    const existingLocal = list.find(x=>x.id===id);
    if(existingLocal){ existingLocal.status = status; existingLocal.notes = notes; existingLocal.updated_at = now2 } else { list.push({id,status,notes,created_at:now2,updated_at:now2}) }
    localStorage.setItem('mtv_orders_store', JSON.stringify(list));
    alert('Saved locally (server not reachable)');
    loadOrders();
  }
}

async function syncAll(){
  const list = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
  if(!list || list.length===0){ alert('No local orders to sync'); return }
  let succeeded = 0;
  for(const o of list){
    try{
      // ensure created_at exists
      if(!o.created_at) o.created_at = new Date().toISOString();
      await apiFetch('/api/orders', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)});
      succeeded++;
    }catch(e){ console.warn('sync failed for', o.id, e); }
  }
  if(succeeded>0){
    alert('Synced '+succeeded+' orders to server');
    // clear local store
    localStorage.removeItem('mtv_orders_store');
  }else alert('No orders were synced');
  loadOrders();
}

function clearLocal(){
  if(confirm('Clear local stored orders?')){
    localStorage.removeItem('mtv_orders_store');
    loadOrders();
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('admin-form').addEventListener('submit', saveOrder);
  document.getElementById('clear-local').addEventListener('click', clearLocal);
  document.getElementById('sync-all').addEventListener('click', syncAll);
  loadOrders();
  // poll for real-time-ish updates when server is available
  setInterval(()=>{
    // only poll if page visible
    if(document.hidden) return;
    loadOrders();
  }, 5000);
});