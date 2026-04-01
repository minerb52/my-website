async function apiFetch(url, opts){
  try{
    const res = await fetch(url, opts);
    if(!res.ok) throw res;
    return await res.json();
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
    el.innerHTML = `<div style="cursor:pointer"><strong>${o.id}</strong><div class="muted" style="font-size:13px">${o.status} — ${o.created_at||''}</div></div>
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
      const res = await fetch('/api/orders/' + encodeURIComponent(id), {method:'DELETE'});
      if(res.ok){ alert('Deleted'); loadOrders(); return }
      throw new Error('Delete failed');
    }catch(e){
      // fallback: remove from localStorage
      const list = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
      const idx = list.findIndex(x=>x.id===id);
      if(idx>=0){ list.splice(idx,1); localStorage.setItem('mtv_orders_store', JSON.stringify(list)); alert('Deleted locally'); loadOrders(); }
      else alert('Failed to delete');
    }
  }));
}

async function loadOrders(){
  const container = document.getElementById('orders');
  container.innerHTML = 'Loading...';
  try{
    const list = await apiFetch('/api/orders');
    renderList(list);
  }catch(e){
    // fallback to localStorage
    const ls = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
    renderList(ls);
  }
}

function fillFormFromList(id){
  // look in server list first, then local
  apiFetch('/api/orders/' + encodeURIComponent(id)).then(o=>{
    document.getElementById('a-id').value = o.id;
    document.getElementById('a-status').value = o.status || '';
    document.getElementById('a-notes').value = o.notes || '';
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

  const payload = {id,status,notes};
  try{
    await apiFetch('/api/orders', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    alert('Saved to server');
    loadOrders();
  }catch(e){
    // fallback save locally
    const list = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
    const now = new Date().toISOString();
    const existing = list.find(x=>x.id===id);
    if(existing){ existing.status = status; existing.notes = notes; existing.updated_at = now } else { list.push({id,status,notes,created_at:now,updated_at:now}) }
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
      await apiFetch('/api/orders', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)});
      succeeded++;
    }catch(e){ console.warn('sync failed for', o.id); }
  }
  if(succeeded>0){
    alert('Synced '+succeeded+' orders to server');
    // optional: clear local store
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
});