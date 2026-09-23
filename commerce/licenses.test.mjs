import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {canonicalJson,encodeKey,makeLicense,verifyLicense,licensingReady} from './licenses.mjs';

// Fixed test seed (bytes 0..31) - never a real signing key.
const seed = Buffer.from([...Array(32).keys()]).toString('base64');
async function publicFor(seedB64){
 const pkcs8=Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(seedB64,'base64')]);
 const priv=await crypto.subtle.importKey('pkcs8',pkcs8,{name:'Ed25519'},true,['sign']);
 const jwk=await crypto.subtle.exportKey('jwk',priv);
 return Buffer.from(jwk.x,'base64url').toString('base64');
}

test('canonical JSON matches Python json.dumps(sort_keys, compact, ensure_ascii)', ()=>{
 assert.equal(canonicalJson({b:1,a:[true,null,'x'],'é':'Zoë "q" \\ \n\t\u0001\u007f 🎮'}),
  '{"a":[true,null,"x"],"b":1,"\\u00e9":"Zo\\u00eb \\"q\\" \\\\ \\n\\t\\u0001\\u007f \\ud83c\\udfae"}');
});

test('license is signed, self-verified, and rejected when altered', async ()=>{
 const env={LICENSE_SIGNING_KEY:seed,LICENSE_PUBLIC_KEY:await publicFor(seed)};
 assert.equal(licensingReady(env),true);
 const {doc,key}=await makeLicense({licensee:'Zoë O\'Brien "Test" 🎮',orderId:'order-1',licenseId:'abc123',issuedAt:'2026-09-23T00:00:00.000Z'},env);
 assert.equal(await verifyLicense(doc,env.LICENSE_PUBLIC_KEY),true);
 assert.equal(await verifyLicense({...doc,seats:5},env.LICENSE_PUBLIC_KEY),false);
 assert.ok(key.startsWith('BAC1-')&&!key.includes('='));
 assert.deepEqual(JSON.parse(Buffer.from(key.slice(5),'base64url').toString()),doc);
});

test('a wrong signing key never produces a key', async ()=>{
 const env={LICENSE_SIGNING_KEY:seed,LICENSE_PUBLIC_KEY:await publicFor(Buffer.alloc(32,7).toString('base64'))};
 await assert.rejects(makeLicense({licensee:'X',orderId:'o',licenseId:'l',issuedAt:'t'},env),/does not match/);
});

// Cross-language: BAC's own Python verifier must accept keys signed here.
const bacRoot=process.env.BAC_REPO||'C:/BORGAS/AssetCreator';
const python=process.env.BAC_PYTHON||(process.env.LOCALAPPDATA?process.env.LOCALAPPDATA+'/BORGAS/AssetCreator/runtime/app-env/Scripts/python.exe':'');
const haveBac=existsSync(bacRoot+'/server/bac_license.py')&&existsSync(python);
test('BAC (Python) accepts a key signed by the Worker, and the Worker verifies a Python license', {skip:!haveBac&&'BAC repository/Python not available'}, async ()=>{
 const pub=await publicFor(seed);
 const env={LICENSE_SIGNING_KEY:seed,LICENSE_PUBLIC_KEY:pub};
 const {key}=await makeLicense({licensee:'Zoë O\'Brien "Test" 🎮',orderId:'4f1c-9a',licenseId:'deadbeefcafe0001',issuedAt:new Date().toISOString(),notes:'borgas.us order'},env);
 const script=`
import sys, json, base64
sys.path.insert(0, ${JSON.stringify(bacRoot+'/server')})
import bac_license as L
key, pub, seed = sys.argv[1], sys.argv[2], base64.b64decode(sys.argv[3])
doc = L.decode_key(key)
ok = L.evaluate(doc, pub)
bad = dict(doc); bad["licensee"] = "Someone Else"
made = L.make_license(licensee="Py Buyer", edition="indie", issued_at="2026-09-23T00:00:00Z", expires_at=None, seats=1, secret=seed, license_id="py0001")
made["orderId"] = "ORD-PY"
made["signature"] = base64.b64encode(L.ed25519_sign(L.canonical_payload(made), seed, L.ed25519_publickey(seed))).decode()
print(json.dumps({"state": ok["state"], "licensee": ok["licensee"], "features": ok["features"], "tampered": L.evaluate(bad, pub)["state"], "python_doc": made}))`;
 const out=JSON.parse(execFileSync(python,['-c',script,key,pub,seed],{encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8'}}));
 assert.equal(out.state,'valid');
 assert.equal(out.licensee,'Zoë O\'Brien "Test" 🎮');
 assert.deepEqual(out.features,['commercial-use','export','finish','generate','qa']);
 assert.equal(out.tampered,'invalid');
 assert.equal(await verifyLicense(out.python_doc,pub),true);
});
