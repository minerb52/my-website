const orders = {
  "ABC123": {
    status: "Delivered",
    update: "Delivered successfully"
  },
  "XYZ999": {
    status: "In Transit",
    update: "Arrived at local depot — expected delivery in 2 days"
  }
};

function order(){
  const url = 'https://instagram.com/mtvhoops.legit';
  window.open(url, '_blank', 'noopener');
}

function submitTrack(e){
  if(e) e.preventDefault();

  const input = document.getElementById('order-id');
  const id = input.value.trim().toUpperCase();
  const result = document.getElementById('track-result');

  result.innerHTML = '';
  result.hidden = false;

  // Validate format
  if (!/^[A-Z0-9]{6}$/.test(id)) {
    result.innerHTML = '<div style="color:red">Invalid Order ID format</div>';
    return false;
  }

  // Check existence
  if (!orders[id]) {
    result.innerHTML = '<div style="color:red">Order not found</div>';
    return false;
  }

  // Render real data
  const data = orders[id];

  result.innerHTML = `
    <div class="row">
      <strong>Order ID</strong>
      <div>${id}</div>
    </div>

    <div class="row">
      <strong>Status</strong>
      <div class="status-pill">${data.status}</div>
    </div>

    <div style="margin-top:14px">
      <strong>Latest update</strong>
      <div style="color:#6b6b6b;margin-top:6px">
        ${data.update}
      </div>
    </div>
  `;

  return false;
}

// Auto fill from URL
document.addEventListener('DOMContentLoaded', ()=>{
  const params = new URLSearchParams(window.location.search);
  const q = params.get('order');
  if(q){
    document.getElementById('order-id').value = q;
    submitTrack();
  }
});