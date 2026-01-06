/**
 * HR Module Seeder
 */

import { Prisma } from '@prisma/tenant-client';
import { ModuleSeeder, SeederContext, SeederResult, randomChoice, randomDecimal, randomDate } from './base-seeder';

export class HRSeeder implements ModuleSeeder {
  moduleSlug = 'hr';
  moduleName = 'Human Resources';
  description = 'İnsan kaynakları demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug, adminUserId } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // Employee Users
      const employeeNames = [
        'Emre Yılmaz',
        'Deniz Kaya',
        'Canan Arslan',
        'Oğuz Demir',
        'Sibel Çelik',
        'Kerem Öztürk',
        'Pınar Şahin',
        'Baran Aydın',
      ];
      const departments = ['Yazılım', 'Satış', 'Finans', 'İK', 'Operasyon', 'Pazarlama'];

      const employeeUsers: any[] = [];
      for (let idx = 0; idx < employeeNames.length; idx++) {
        const name = employeeNames[idx]!;
        const emailName = name
          .toLowerCase()
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ç/g, 'c')
          .replace(/ğ/g, 'g')
          .replace(' ', '.');

        const user = await tenantPrisma.user.upsert({
          where: { email: `demo.${emailName}@${tenantSlug}.com` },
          update: {},
          create: {
            name,
            email: `demo.${emailName}@${tenantSlug}.com`,
            username: `demo.${emailName}`,
            password: '$2a$10$dummy.hash.for.demo.purposes',
            role: 'ClientUser',
            status: 'active',
            department: randomChoice(departments),
            position: randomChoice(['Uzman', 'Kıdemli Uzman', 'Yönetici', 'Koordinatör']),
            phone: `053${idx} ${idx}${idx}${idx} ${idx + 1}${idx + 1}${idx + 1}${idx + 1}`,
          },
        });
        employeeUsers.push(user);
        itemsCreated++;
      }
      details['users'] = employeeUsers.length;

      // Employees - ilk olarak managerId olmadan oluştur
      const employees: any[] = [];
      for (let idx = 0; idx < employeeUsers.length; idx++) {
        const user = employeeUsers[idx];
        const employee = await tenantPrisma.employee.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            tenantId,
            companyId,
            employeeNumber: `EMP-DEMO-${String(idx + 1).padStart(4, '0')}`,
            department: user.department || 'Genel',
            position: user.position || 'Uzman',
            hireDate: randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)),
            managerId: null, // İlk olarak null olarak oluştur
            salary: randomDecimal(25000, 80000),
            salaryGroup: randomChoice(['A', 'B', 'C']),
            // currency alanı varsayılan "TRY" kullanacak - GeneralSettings'ten formatlanacak
            workType: randomChoice(['full_time', 'full_time', 'part_time', 'contract']),
            isActive: true,
          },
        });
        employees.push(employee);
        itemsCreated++;
      }

      // Manager ilişkilerini güncelle (ilk çalışan yönetici olarak atanır)
      if (employees.length > 1) {
        const managerId = employees[0].id;
        for (let idx = 1; idx < employees.length; idx++) {
          await tenantPrisma.employee.update({
            where: { id: employees[idx].id },
            data: { managerId },
          });
        }
      }
      details['employees'] = employees.length;

      // Leaves
      const leaveTypes = ['annual', 'sick', 'unpaid', 'maternity'];
      let leavesCreated = 0;

      for (const emp of employees.slice(0, 6)) {
        for (let leaveIdx = 0; leaveIdx < 2; leaveIdx++) {
          const startDate = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
          const days = randomChoice([1, 2, 3, 5, 7, 14]);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + days);

          await tenantPrisma.leave.create({
            data: {
              tenantId,
              companyId,
              employeeId: emp.id,
              type: randomChoice(leaveTypes),
              startDate,
              endDate,
              days,
              status: randomChoice(['pending', 'approved', 'approved', 'rejected']),
              approvedBy: leaveIdx % 2 === 0 ? adminUserId : null,
              approvedAt: leaveIdx % 2 === 0 ? new Date() : null,
              reason: 'Demo izin talebi',
            },
          });
          leavesCreated++;
          itemsCreated++;
        }
      }
      details['leaves'] = leavesCreated;

      // Payrolls
      let payrollsCreated = 0;
      for (const emp of employees) {
        for (let monthIdx = 0; monthIdx < 3; monthIdx++) {
          const payDate = new Date();
          payDate.setMonth(payDate.getMonth() - monthIdx);
          payDate.setDate(25);

          const grossSalary = emp.salary || new Prisma.Decimal(30000);
          const taxDeduction = new Prisma.Decimal(Number(grossSalary) * 0.15);
          const sgkDeduction = new Prisma.Decimal(Number(grossSalary) * 0.14);
          const deductions = new Prisma.Decimal(Number(taxDeduction) + Number(sgkDeduction));
          const netSalary = new Prisma.Decimal(Number(grossSalary) - Number(deductions));

          const period = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;

          await tenantPrisma.payroll.create({
            data: {
              tenantId,
              companyId,
              employeeId: emp.id,
              period,
              payDate,
              grossSalary,
              deductions,
              netSalary,
              taxDeduction,
              sgkDeduction,
              bonuses: monthIdx === 0 ? randomDecimal(0, 5000) : new Prisma.Decimal(0),
              overtime: randomDecimal(0, 2000),
              status: monthIdx > 0 ? 'paid' : randomChoice(['draft', 'approved', 'paid']),
              notes: 'Demo bordro',
            },
          });
          payrollsCreated++;
          itemsCreated++;
        }
      }
      details['payrolls'] = payrollsCreated;

      return { success: true, itemsCreated, details };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message, details };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete payrolls
      const payrollResult = await tenantPrisma.payroll.deleteMany({
        where: { notes: 'Demo bordro' },
      });
      itemsDeleted += payrollResult.count;

      // Delete leaves
      const leaveResult = await tenantPrisma.leave.deleteMany({
        where: { reason: 'Demo izin talebi' },
      });
      itemsDeleted += leaveResult.count;

      // Delete employees
      const employeeResult = await tenantPrisma.employee.deleteMany({
        where: { employeeNumber: { startsWith: 'EMP-DEMO-' } },
      });
      itemsDeleted += employeeResult.count;

      // Delete users (demo users)
      const userResult = await tenantPrisma.user.deleteMany({
        where: { email: { startsWith: 'demo.' } },
      });
      itemsDeleted += userResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const employeeCount = await tenantPrisma.employee.count({
      where: { employeeNumber: { startsWith: 'EMP-DEMO-' } },
    });

    const userCount = await tenantPrisma.user.count({
      where: { email: { startsWith: 'demo.' } },
    });

    const count = employeeCount + userCount;
    return { hasData: count > 0, count };
  }
}
