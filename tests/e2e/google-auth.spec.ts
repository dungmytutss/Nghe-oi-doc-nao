import { expect, test } from '@playwright/test';

const userId='00000000-0000-4000-8000-000000000001';
const factorId='00000000-0000-4000-8000-000000000002';
const user={id:userId,email:'teacher@example.test',aud:'authenticated',role:'authenticated',
  app_metadata:{provider:'google',providers:['google']},user_metadata:{},created_at:new Date().toISOString(),
  factors:[{id:factorId,factor_type:'totp',status:'verified',created_at:new Date().toISOString(),updated_at:new Date().toISOString()}]};
function callbackHash(){
  const payload=Buffer.from(JSON.stringify({sub:userId,aal:'aal1',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  return new URLSearchParams({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.${Buffer.alloc(32).toString('base64url')}`,
    refresh_token:'isolated-google-refresh',expires_in:'3600',token_type:'bearer'}).toString();
}

test('Google button delegates OAuth navigation to Supabase without Gmail scopes',async({page})=>{
  let authorize:URL|undefined;
  await page.route('https://classroom-test.supabase.co/auth/v1/authorize**',route=>{
    authorize=new URL(route.request().url());
    return route.fulfill({contentType:'text/html',body:'<p>Isolated Supabase OAuth provider page</p>'});
  });
  await page.goto('/#goc-co');
  await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).click();
  await expect(page).toHaveURL(/^https:\/\/classroom-test.supabase.co\/auth\/v1\/authorize/);
  expect(authorize!.searchParams.get('provider')).toBe('google');
  expect(authorize!.searchParams.get('redirect_to')).toBe('http://127.0.0.1:4173/?auth=teacher');
  expect(authorize!.searchParams.get('prompt')).toBe('select_account');
  expect(authorize!.searchParams.get('access_type')).not.toBe('offline');
  expect(authorize!.searchParams.get('scopes')||'').not.toContain('gmail');
});

for(const role of ['teacher','parent']) {
  test(`Supabase SDK restores the Google callback; role ${role} cannot bypass class access`,async({page})=>{
    let classReads=0;
    await page.route('https://classroom-test.supabase.co/**',route=>{
      const path=new URL(route.request().url()).pathname;
      if(path.endsWith('/user')) return route.fulfill({json:user});
      if(path.endsWith('/profiles')) return route.fulfill({json:{role}});
      if(path.endsWith('/classrooms')){classReads++;return route.fulfill({json:[]});}
      return route.fulfill({status:400,json:{message:'Unexpected isolated auth test request'}});
    });
    await page.goto('/?auth=teacher#'+callbackHash());
    await expect(page.getByText('Đã đăng nhập:',{exact:false})).toBeVisible();
    await expect(page.getByRole('heading',{name:'👩‍🏫 Góc của cô',exact:true})).toBeVisible();
    if(role==='teacher') await expect(page.getByLabel('Mã xác thực 6 số')).toBeVisible();
    else await expect(page.getByRole('status')).toContainText('chưa được cấp quyền giáo viên');
    expect(classReads).toBe(0);
    expect(page.url()).not.toContain('access_token=');
  });
}
