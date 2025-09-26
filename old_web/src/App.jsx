import React, { useState } from 'react'
import { postFile } from './api'

export default function App(){
  const [imgOut, setImgOut] = useState(null)
  const [extracted, setExtracted] = useState('')
  const [txHash, setTxHash] = useState('')
  const [verify, setVerify] = useState(null)

  return (
    <div style={{maxWidth: 900, margin:'20px auto', fontFamily:'Inter, system-ui, Arial'}}>
      <h1>Hybrid Invisible Watermark (Image/Video) + On-chain Proof</h1>
      <p style={{opacity:0.8}}>Demo: upload → embed invisible watermark → register hash on Polygon Amoy → verify later.</p>

      <section style={{border:'1px solid #ccc', padding:16, borderRadius:8, marginBottom:20}}>
        <h2>1) Watermark Image</h2>
        <ImageEmbed onDone={(blob)=> setImgOut(URL.createObjectURL(blob))} />
        {imgOut && <p><a href={imgOut} download="watermarked.png">Download watermarked image</a></p>}
      </section>

      <section style={{border:'1px solid #ccc', padding:16, borderRadius:8, marginBottom:20}}>
        <h2>2) Extract Watermark (Image)</h2>
        <ImageExtract onText={setExtracted} />
        {extracted && <p><b>Extracted:</b> {extracted}</p>}
      </section>

      <section style={{border:'1px solid #ccc', padding:16, borderRadius:8, marginBottom:20}}>
        <h2>3) Register On-chain (hash of file)</h2>
        <RegisterOnChain onTx={setTxHash} />
        {txHash && <p>Tx: <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a></p>}
      </section>

      <section style={{border:'1px solid #ccc', padding:16, borderRadius:8}}>
        <h2>4) Verify by Hash Lookup</h2>
        <VerifyOnChain onResult={setVerify} />
        {verify && <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(verify, null, 2)}</pre>}
      </section>
    </div>
  )
}

function ImageEmbed({ onDone }){
  const [file, setFile] = useState(null)
  const [text, setText] = useState('Owned by Souvik')
  const [key, setKey] = useState('secret')
  const [q, setQ] = useState(8)

  async function submit(){
    if(!file) return alert('Choose an image')
    const r = await postFile('/api/watermark/image', file, { text, key, q })
    const blob = await r.blob()
    onDone(blob)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} />
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Watermark text" style={{flex:1}}/>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="Key" />
        <input type="number" value={q} onChange={e=>setQ(e.target.value)} style={{width:100}} />
        <button onClick={submit}>Embed</button>
      </div>
    </div>
  )
}

function ImageExtract({ onText }){
  const [file, setFile] = useState(null)
  const [key, setKey] = useState('secret')
  const [q, setQ] = useState(8)
  async function submit(){
    if(!file) return alert('Choose an image')
    const r = await postFile('/api/watermark/image/extract', file, { key, q })
    const data = await r.json()
    onText(data.text || '')
  }
  return (
    <div>
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} />
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="Key" />
        <input type="number" value={q} onChange={e=>setQ(e.target.value)} style={{width:100}} />
        <button onClick={submit}>Extract</button>
      </div>
    </div>
  )
}

function RegisterOnChain({ onTx }){
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('My original work')
  async function submit(){
    if(!file) return alert('Choose a file (image/video)')
    const r = await postFile('/api/register', file, { note })
    const data = await r.json()
    onTx(data.txHash || '')
  }
  return (
    <div>
      <input type="file" onChange={e=>setFile(e.target.files[0])} />
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <input value={note} onChange={e=>setNote(e.target.value)} style={{flex:1}}/>
        <button onClick={submit}>Register</button>
      </div>
    </div>
  )
}

function VerifyOnChain({ onResult }){
  const [file, setFile] = useState(null)
  async function submit(){
    if(!file) return alert('Choose a file (image/video)')
    const r = await postFile('/api/verify', file, {})
    const data = await r.json()
    onResult(data)
  }
  return (
    <div>
      <input type="file" onChange={e=>setFile(e.target.files[0])} />
      <div style={{marginTop:8}}>
        <button onClick={submit}>Verify</button>
      </div>
    </div>
  )
}
