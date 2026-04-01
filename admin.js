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

async function loadOrders(){
  const container = document.getElementById('orders');
  container.innerHTML = 'Loading...';
  try{
    const list = await apiFetch('/api/orders');
    if(!Array.isArray(list)) throw new Error('Bad response');
    if(list.length===0) container.innerHTML = '<div class="muted">No orders yet</div>';
    else container.innerHTML = list.map(o=>`<div class="order-item"><div><strong>${o.id}</strong><div class="muted" style="font-size:13px">${o.status} — ${o.created_at||''}</div></div><div>${o.notes||''}</div></div>`).join('');
  }catch(e){
    // fallback to localStorage
    const ls = JSON.parse(localStorage.getItem('mtv_orders_store')||'[]');
    if(ls.length===0) container.innerHTML = '<div class="muted">No orders (no server)</div>';
    else container.innerHTML = ls.map(o=>`<div class="order-item"><div><strong>${o.id}</strong><div class="muted" style="font-size:13px">${o.status} — ${o.created_at||''}</div></div><div>${o.notes||''}</div></div>`).join('');
  }
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

function clearLocal(){
  if(confirm('Clear local stored orders?')){
    localStorage.removeItem('mtv_orders_store');
    loadOrders();
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('admin-form').addEventListener('submit', saveOrder);
  document.getElementById('clear-local').addEventListener('click', clearLocal);
  loadOrders();
});