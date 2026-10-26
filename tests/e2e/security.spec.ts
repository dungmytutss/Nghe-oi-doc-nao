import { expect, test } from '@playwright/test';

const teacherId='00000000-0000-4000-8000-000000000001';
const factorId='00000000-0000-4000-8000-000000000002';
const factor={id:factorId,factor_type:'totp',status:'verified',friendly_name:'Teacher authenticator',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
const user={id:teacherId,email:'teacher@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString(),factors:[factor]};
function authSession(aal:string){
  const payload=Buffer.from(JSON.stringify({sub:teacherId,aal,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  return {access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.${Buffer.alloc(32).toString('base64url')}`,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user};
}

test('teacher cannot load classes until the authenticator challenge succeeds',async({page})=>{
  let classReads=0;
  await page.route('https://classroom-test.supabase.co/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path.endsWith('/token')) return route.fulfill({json:authSession('aal1')});
    if(path.endsWith('/user')) return route.fulfill({json:user});
    if(path.endsWith('/profiles')) return route.fulfill({json:{role:'teacher'}});
    if(path.endsWith('/challenge')) return route.fulfill({json:{id:'challenge-id',type:'totp',expires_at:Math.floor(Date.now()/1000)+60}});
    if(path.endsWith('/verify')){
      if(route.request().postDataJSON().code!=='123456') return route.fulfill({status:422,json:{error_code:'mfa_verification_failed',msg:'Invalid code'}});
      return route.fulfill({json:authSession('aal2')});
    }
    if(path.endsWith('/classrooms')){classReads++;return route.fulfill({json:[]});}
    return route.fulfill({status:400,json:{message:'Unexpected isolated test request'}});
  });
  await page.goto('/#goc-co');
  await page.getByLabel('Email',{exact:true}).fill(user.email);
  await page.getByLabel('Mật khẩu',{exact:true}).fill('test-password-123');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page.getByLabel('Mã xác thực 6 số')).toBeVisible();
  expect(classReads).toBe(0);
  await page.getByLabel('Mã xác thực 6 số').fill('000000');
  await page.getByRole('button',{name:'Xác nhận mã',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Chưa xác nhận được mã');
  expect(classReads).toBe(0);
  await page.getByLabel('Mã xác thực 6 số').fill('123456');
  await page.getByRole('button',{name:'Xác nhận mã',exact:true}).click();
  await expect(page.getByRole('button',{name:'Tạo lớp và cấp mã học sinh',exact:true})).toBeVisible();
  expect(classReads).toBeGreaterThan(0);
});

test('CSP blocks injected event handlers and guest restore rejects malformed data',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const image=document.createElement('img'); image.setAttribute('onerror','window.__injected=true'); image.src='/missing-security-image'; document.body.append(image);
  });
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(()=>Object.hasOwn(window,'__injected'))).toBe(false);
  await page.getByRole('button',{name:'Tiếp tục với tư cách khách'}).click();
  await expect(page.locator('#dauMa')).toHaveText('Khách');
  const before=await page.evaluate(()=>localStorage.getItem('nghe-oi-doc-nao.v1'));
  await page.getByRole('button',{name:'📂 Nhập mã tiến trình',exact:true}).click();
  await page.locator('#chepNoiDung').fill('{"hs":{"__proto__":{"polluted":true}}}');
  await page.locator('#chepNhap').click();
  await expect(page.locator('#chepLoi')).toContainText('không hợp lệ');
  expect(await page.evaluate(()=>localStorage.getItem('nghe-oi-doc-nao.v1'))).toBe(before);
});

test('teacher sets up TOTP explicitly and verifies before seeing class data',async({page})=>{
  let enrollments=0,verified=false,classReads=0;
  await page.route('https://classroom-test.supabase.co/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path.endsWith('/token')) return route.fulfill({json:{...authSession('aal1'),user:{...user,factors:[]}}});
    if(path.endsWith('/user')) return route.fulfill({json:{...user,factors:verified?[factor]:[]}});
    if(path.endsWith('/profiles')) return route.fulfill({json:{role:'teacher'}});
    if(path.endsWith('/factors') && route.request().method()==='POST'){
      enrollments++;
      expect(route.request().postDataJSON().factor_type).toBe('totp');
      return route.fulfill({json:{id:factorId,type:'totp',totp:{secret:'TESTONLYSETUPKEY',uri:'otpauth://totp/test',
        qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="white"/></svg>'}}});
    }
    if(path.endsWith('/challenge')) return route.fulfill({json:{id:'challenge-id',type:'totp',expires_at:Math.floor(Date.now()/1000)+60}});
    if(path.endsWith('/verify')){verified=true;return route.fulfill({json:authSession('aal2')});}
    if(path.endsWith('/classrooms')){classReads++;return route.fulfill({json:[]});}
    return route.fulfill({status:400,json:{message:'Unexpected isolated test request'}});
  });
  await page.goto('/#goc-co');
  await page.getByLabel('Email',{exact:true}).fill(user.email);
  await page.getByLabel('Mật khẩu',{exact:true}).fill('test-password-123');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page.getByRole('button',{name:'Thiết lập xác thực hai bước',exact:true})).toBeVisible();
  expect({enrollments,classReads}).toEqual({enrollments:0,classReads:0});
  await page.getByRole('button',{name:'Thiết lập xác thực hai bước',exact:true}).click();
  await expect(page.locator('.mfa-qr')).toBeVisible();
  expect(await page.locator('.mfa-qr').evaluate((image:HTMLImageElement)=>image.complete && image.naturalWidth>0)).toBe(true);
  await page.getByLabel('Mã xác thực 6 số').fill('123456');
  await page.getByRole('button',{name:'Xác nhận mã',exact:true}).click();
  await expect(page.getByRole('button',{name:'Tạo lớp và cấp mã học sinh',exact:true})).toBeVisible();
  await expect(page.locator('.mfa-secret')).toHaveCount(0);
  const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));
  expect(storage).not.toContain('TESTONLYSETUPKEY');
  expect(enrollments).toBe(1);expect(classReads).toBeGreaterThan(0);
});
