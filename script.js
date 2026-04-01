function clickMe(){
  alert('Working');
}

function order(){
  // Open Instagram order link in a new tab
  const url = 'https://instagram.com/mtvhoops.legit';
  window.open(url, '_blank', 'noopener');
}

function scrollToProduct(e){
  if(e) e.preventDefault();
  const el = document.getElementById('product');
  if(!el) return;
  el.scrollIntoView({behavior:'smooth', block:'start'});
}

// Small enhancement: close mobile nav when a link is clicked (if future mobile menu added)
document.addEventListener('DOMContentLoaded', ()=>{
  // placeholder for future interactivity
});