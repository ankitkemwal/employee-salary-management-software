import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import { sqlite } from "../src/db/client";
import { initSchema } from "../src/db/init";
import { DEPARTMENTS, COUNTRIES, COUNTRY_CURRENCY, CURRENCY_SALARY_RANGE } from "../src/db/constants";
import { EMPLOYMENT_TYPES } from "../src/db/schema";

const EMPLOYEE_COUNT = 10_000;
const HIRE_FROM = new Date("2015-01-01");
const HIRE_TO = new Date("2026-06-01");

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function randomSalary(currency: string): number {
  const [min, max] = CURRENCY_SALARY_RANGE[currency];
  const raw = faker.number.int({ min, max });
  const roundTo = max > 100_000 ? 1000 : 100;
  return Math.round(raw / roundTo) * roundTo;
}

function seed() {
  initSchema();
  sqlite.exec("DELETE FROM audit_logs; DELETE FROM salary_records; DELETE FROM employees;");

  const insertEmployee = sqlite.prepare(`
    INSERT INTO employees
      (id, employee_code, first_name, last_name, email, department, job_title, country, employment_type, hire_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);
  const insertSalary = sqlite.prepare(`
    INSERT INTO salary_records
      (id, employee_id, amount, currency, effective_date, reason, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'hr-manager')
  `);

  const usedEmails = new Set<string>();

  sqlite.exec("BEGIN");
  try {
    for (let i = 1; i <= EMPLOYEE_COUNT; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      let email = faker.internet.email({ firstName, lastName }).toLowerCase();
      while (usedEmails.has(email)) {
        email = `${firstName}.${lastName}.${i}@acme.com`.toLowerCase();
      }
      usedEmails.add(email);

      const department = faker.helpers.arrayElement(DEPARTMENTS);
      const country = faker.helpers.arrayElement(COUNTRIES);
      const currency = COUNTRY_CURRENCY[country];
      const employmentType = faker.helpers.weightedArrayElement([
        { value: EMPLOYMENT_TYPES[0], weight: 8 },
        { value: EMPLOYMENT_TYPES[1], weight: 1 },
        { value: EMPLOYMENT_TYPES[2], weight: 1 },
      ]);
      const hireDate = isoDate(faker.date.between({ from: HIRE_FROM, to: HIRE_TO }));
      const jobTitle = faker.person.jobTitle();
      const id = randomUUID();
      const employeeCode = `EMP-${String(i).padStart(5, "0")}`;

      insertEmployee.run(
        id,
        employeeCode,
        firstName,
        lastName,
        email,
        department,
        jobTitle,
        country,
        employmentType,
        hireDate,
      );

      const baseAmount = randomSalary(currency);
      insertSalary.run(randomUUID(), id, baseAmount, currency, hireDate, "Initial salary");

      // Give ~30% of employees a documented raise, so salary history has
      // something to show beyond a single row.
      if (Math.random() < 0.3) {
        const raiseDate = faker.date.between({ from: hireDate, to: HIRE_TO });
        if (raiseDate > new Date(hireDate)) {
          const raised = Math.round(baseAmount * (1 + Math.random() * 0.2));
          insertSalary.run(
            randomUUID(),
            id,
            raised,
            currency,
            isoDate(raiseDate),
            "Annual Review",
          );
        }
      }

      if (i % 1000 === 0) console.log(`Seeded ${i}/${EMPLOYEE_COUNT}`);
    }
    sqlite.exec("COMMIT");
  } catch (err) {
    sqlite.exec("ROLLBACK");
    throw err;
  }

  console.log(`Done. Seeded ${EMPLOYEE_COUNT} employees.`);
}

seed();
