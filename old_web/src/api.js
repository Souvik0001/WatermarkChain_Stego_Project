export async function postFile(url, file, fields={}){
  const fd = new FormData();
  fd.append('file', file);
  Object.entries(fields).forEach(([k,v])=>fd.append(k, v));
  const r = await fetch(url, { method: 'POST', body: fd });
  if(!r.ok){
    let msg = await r.text();
    throw new Error(msg || 'Request failed');
  }
  return r;
}
