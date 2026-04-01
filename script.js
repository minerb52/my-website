// Lightweight tracking interactions

function order(){
  const url = 'https://instagram.com/mtvhoops.legit';
  window.open(url, '_blank', 'noopener');
}

function submitTrack(e){
  if(e) e.preventDefault();
  const input = document.getElementById('order-id');
  const id = input.value && input.value.trim();
  const result = document.getElementById('track-result');
  result.innerHTML = '';

  if(!id){
    input.focus();
    input.style.outline = '2px solid #ff6b6b';
    setTimeout(()=> input.style.outline = 'none', 1200);
    return false;
  }

  // Simulate fetch to backend — show loading state then mock data
  const loading = document.createElement('div');
  loading.textContent = 'Searching for "' + id + '"...';
  loading.style.opacity = '0.9';
  result.hidden = false;
  result.appendChild(loading);

  setTimeout(()=>{
    result.innerHTML = '';
    // Mock order data — in a real app this would be fetched from server
    const title = document.createElement('div');
    title.className = 'row';
    title.innerHTML = '<strong>Order ID</strong><div>' + id + '</div>';

    const statusRow = document.createElement('div');
    statusRow.className = 'row';
    statusRow.innerHTML = '<strong>Status</strong><div class="status-pill">In Transit</div>';

    const timeline = document.createElement('div');
    timeline.style.marginTop = '14px';
    timeline.innerHTML = '<div><strong>Latest update</strong><div style="color:#6b6b6b;margin-top:6px">Arrived at local depot — expected delivery in 2 days</div></div>';

    result.appendChild(title);
    result.appendChild(statusRow);
    result.appendChild(timeline);

    // Save to localStorage so admin sync/demo can show records
    try{
      const list = JSON.parse(localStorage.getItem('mtv_orders')||'[]');
      if(!list.includes(id)) list.push(id);
      localStorage.setItem('mtv_orders', JSON.stringify(list));
    }catch(err){/* ignore */}
  }, 900);

  return false;
}

// For quick testing: prefill if url has ?order=
document.addEventListener('DOMContentLoaded', ()=>{
  const params = new URLSearchParams(window.location.search);
  const q = params.get('order');
  if(q){
    document.getElementById('order-id').value = q;
    submitTrack();
  }
});