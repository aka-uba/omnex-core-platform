/**
 * API Test Script
 * 
 * Tüm API endpoint'lerini test eder ve performans ölçer
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDbUrl } from '../src/lib/services/tenantService';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`http://localhost:3000${endpoint}`, options);
    const responseTime = Date.now() - startTime;
    let data: any = {};
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch (e) {
      // Response is not JSON
    }

    const errorMessage = response.ok 
      ? undefined 
      : (data.error || data.message || data.details || (data.success === false ? 'Request failed' : 'Unknown error'));

    // Log full error details for debugging failed endpoints
    if (!response.ok && endpoint.includes('users/')) {
      console.error(`\n🔍 Detailed error for ${endpoint}:`, JSON.stringify(data, null, 2).substring(0, 500));
    }

    return {
      endpoint,
      method,
      status: response.status,
      responseTime,
      success: response.ok,
      error: errorMessage,
      details: !response.ok ? JSON.stringify(data).substring(0, 300) : undefined,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      method,
      status: 0,
      responseTime,
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function main() {
  console.log('🧪 Testing all API endpoints...\n');

  try {
    // 1. Get active tenant
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
      take: 1,
    });

    if (tenants.length === 0) {
      console.log('❌ No active tenants found. Please create a tenant first.');
      return;
    }

    const tenant = tenants[0];
    const tenantSlug = tenant.slug;
    console.log(`📊 Using tenant: ${tenant.name} (${tenant.slug})\n`);

    // Get tenant admin user for testing
    const dbUrl = getTenantDbUrl(tenant);
    const tenantPrisma = getTenantPrisma(dbUrl);
    const testUser = await tenantPrisma.user.findFirst({
      where: { role: 'SuperAdmin' },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
      },
    });

    if (!testUser || !testUser.id) {
      console.log('❌ No test user found in tenant. Please seed the tenant first.');
      return;
    }

    console.log(`👤 Using test user: ${testUser.email} (ID: ${testUser.id})\n`);

    // Test headers with tenant context
    const testHeaders = {
      'x-tenant-slug': tenantSlug,
      'x-tenant-source': 'path',
      'Cookie': `tenant-slug=${tenantSlug}`,
    };

    // 2. Test Auth APIs
    console.log('🔐 Testing Auth APIs...');
    results.push(await testEndpoint('/api/auth/login', 'POST', {
      username: testUser.email,
      password: 'Omnex123!',
    }));
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting

    // 3. Test Users APIs
    console.log('👥 Testing Users APIs...');
    results.push(await testEndpoint(`/api/users`, 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));
    
    results.push(await testEndpoint(`/api/users/${testUser.id}`, 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Test Roles APIs
    console.log('🎭 Testing Roles APIs...');
    results.push(await testEndpoint('/api/roles', 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 5. Test Permissions APIs
    console.log('🔑 Testing Permissions APIs...');
    results.push(await testEndpoint('/api/permissions', 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 6. Test Notifications APIs
    console.log('🔔 Testing Notifications APIs...');
    results.push(await testEndpoint('/api/notifications', 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 7. Test Audit Logs APIs
    console.log('📝 Testing Audit Logs APIs...');
    results.push(await testEndpoint('/api/audit-logs', 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test with limit parameter for performance (limit to 20 records)
    results.push(await testEndpoint(`/api/audit-logs/user/${testUser.id}?limit=20`, 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 8. Test Modules APIs
    console.log('📦 Testing Modules APIs...');
    results.push(await testEndpoint('/api/modules', 'GET', undefined, testHeaders));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 9. Test Tenants APIs (should work without tenant context)
    console.log('🏢 Testing Tenants APIs...');
    results.push(await testEndpoint('/api/tenants', 'GET'));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 10. Print Results
    console.log('\n📊 Test Results:\n');
    console.log('┌─────────────────────────────────────────────────────────────────┬──────────┬──────────┬─────────┐');
    console.log('│ Endpoint                                                     │ Method   │ Status  │ Time(ms)│');
    console.log('├─────────────────────────────────────────────────────────────────┼──────────┼──────────┼─────────┤');

    let successCount = 0;
    let totalTime = 0;
    const slowEndpoints: TestResult[] = [];

    results.forEach((result) => {
      const statusIcon = result.success ? '✅' : '❌';
      const statusColor = result.success ? '' : '\x1b[31m';
      const resetColor = '\x1b[0m';
      
      console.log(
        `│ ${statusIcon} ${result.endpoint.padEnd(60)} │ ${result.method.padEnd(8)} │ ${statusColor}${String(result.status).padEnd(8)}${resetColor} │ ${String(result.responseTime).padStart(7)} │`
      );

      if (result.success) {
        successCount++;
      }
      totalTime += result.responseTime;
      
      if (result.responseTime > 500) {
        slowEndpoints.push(result);
      }

      if (!result.success) {
        const errorMsg = result.error || 'Unknown error';
        console.log(`│   └─ Error: ${errorMsg.substring(0, 70)}${' '.repeat(Math.max(0, 70 - errorMsg.length))} │`);
        if (result.details && result.details.length > 0) {
          const detailsMsg = result.details.substring(0, 70);
          console.log(`│      Details: ${detailsMsg}${' '.repeat(Math.max(0, 70 - detailsMsg.length))} │`);
        }
      }
    });

    console.log('└─────────────────────────────────────────────────────────────────┴──────────┴──────────┴─────────┘');
    
    const avgTime = totalTime / results.length;
    const successRate = (successCount / results.length) * 100;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${results.length}`);
    console.log(`   ✅ Success: ${successCount} (${successRate.toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${results.length - successCount}`);
    console.log(`   ⏱️  Average Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`   🐌 Slow Endpoints (>500ms): ${slowEndpoints.length}`);

    if (slowEndpoints.length > 0) {
      console.log(`\n⚠️  Slow Endpoints:`);
      slowEndpoints.forEach((endpoint) => {
        console.log(`   - ${endpoint.endpoint} (${endpoint.method}): ${endpoint.responseTime}ms`);
      });
    }

    if (successCount === results.length) {
      console.log(`\n✅ All tests passed!`);
    } else {
      console.log(`\n❌ Some tests failed. Please check the errors above.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test script error:', error);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();

