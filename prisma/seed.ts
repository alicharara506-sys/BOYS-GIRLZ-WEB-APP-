import { db } from "../src/server/commerce/db.server";
import { accounts, journal } from "../src/server/commerce/ledger.server";
import { defaults } from "../src/server/commerce/rules";
import { sell } from "../src/server/commerce/sales.server";

if (await db.setting.findUnique({ where: { key: "seed-v1" } }))
  console.log("Demo data already exists; kept all records.");
else
  await db.$transaction(
    async (tx) => {
      for (const [code, name, type] of accounts)
        await tx.account.upsert({
          where: { code },
          update: {},
          create: { code, name, type },
        });
      await tx.setting.upsert({
        where: { key: "shop" },
        update: {},
        create: { key: "shop", value: defaults },
      });
      const rows = [
        ["Everyday Overshirt", "Tops", "Boys", 2800, 1200, 8],
        ["Gingham Day Dress", "Dresses", "Girls", 3200, 1400, 9],
        ["Happy Days Tee", "Tops", "Unisex", 1800, 650, 10],
        ["Adventure Overalls", "Bottoms", "Unisex", 3600, 1600, 11],
        ["Fleece Bear Overall", "Outerwear", "Boys", 3490, 1500, 0],
        ["Little Safari Romper", "Sleepwear", "Unisex", 2990, 1200, 1],
        ["Knit Hooded Cardigan", "Outerwear", "Girls", 3990, 1750, 2],
        ["Teddy Bear Sweater Set", "Sets", "Unisex", 3290, 1400, 3],
        ["Cloud Puffer Overall", "Outerwear", "Boys", 4990, 2300, 4],
        ["Little Cloud Booties", "Accessories", "Unisex", 1890, 700, 5],
        ["Bunny's First Cuddles", "Toys", "Unisex", 2490, 1000, 6],
        ["Sunday Cotton Dress", "Dresses", "Girls", 3490, 1600, 9],
      ] as const;
      const variants = [];
      let inventoryValue = 0;
      for (const [index, row] of rows.entries()) {
        const [name, category, gender, price, cost, imageIndex] = row;
        const product = await tx.product.create({
          data: {
            slug: name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/-$/, ""),
            name,
            category,
            gender,
            price,
            onlinePrice: price + 200,
            cost,
            imageIndex,
            published: true,
            featured: index < 4,
            demo: true,
            description: `Soft, everyday ${name.toLowerCase()} for little adventures. Sample product for the Boys & Girlz demo.`,
            threshold: 5,
          },
        });
        for (const [si, size] of (index >= 9
          ? ["One size"]
          : ["0–3 Months", "2–3 Years", "6–7 Years"]
        ).entries())
          for (const [ci, color] of (gender === "Girls"
            ? ["Pink", "Cream"]
            : ["Blue", "Cream"]
          ).entries()) {
            const stock = index === 8 ? 3 : 18 + si * 3 + ci;
            const sku = `BG${String(index + 1).padStart(3, "0")}${si}${ci}`;
            const variant = await tx.variant.create({
              data: {
                productId: product.id,
                size,
                color,
                sku,
                barcode: sku,
                stock,
                averageCost: cost,
              },
            });
            await tx.stockMovement.create({
              data: {
                variantId: variant.id,
                quantity: stock,
                reason: "Demo opening stock",
                reference: "seed-v1",
              },
            });
            inventoryValue += stock * cost;
            variants.push(variant);
          }
      }
      await journal(tx, "demo-opening", "Demo opening balances", [
        { accountId: "1200", debit: inventoryValue },
        { accountId: "1000", debit: 50000 },
        { accountId: "3000", credit: inventoryValue + 50000 },
      ]);
      const customers = [];
      const people = [
        ["Maya Haddad", "+96170000001", "VIP", "Lea", "Girls", "2–3 Years", 2],
        [
          "Karim Mansour",
          "+96170000002",
          "School-age boys",
          "Adam",
          "Boys",
          "6–7 Years",
          6,
        ],
        [
          "Rana Khoury",
          "+96170000003",
          "Newborn parents",
          "Jad",
          "Boys",
          "0–3 Months",
          0,
        ],
        ["Nour Saleh", "+96170000004", "VIP", "Lina", "Girls", "4–5 Years", 4],
        [
          "Yara Demo",
          "+96170000005",
          "Newborn parents",
          "Sami",
          "Unisex",
          "0–3 Months",
          0,
        ],
      ] as const;
      for (const [i, p] of people.entries()) {
        const birthday = new Date();
        birthday.setUTCFullYear(birthday.getUTCFullYear() - p[6]);
        birthday.setUTCDate(Math.max(1, birthday.getUTCDate() - 5 - i));
        customers.push(
          await tx.customer.create({
            data: {
              name: p[0],
              phone: p[1],
              email: `demo${i + 1}@example.test`,
              address: "Demo address, Beirut",
              tags: [p[2]],
              demo: true,
              children: {
                create: {
                  name: p[3],
                  birthdate: birthday,
                  gender: p[4],
                  size: p[5],
                },
              },
            },
          }),
        );
      }
      const drawer = await tx.drawer.create({
        data: { opening: 10000, note: "Seed demo session" },
      });
      for (let i = 0; i < 28; i++) {
        const channel = i % 3 === 0 ? "online" : "pos";
        const variant = variants[(i * 7) % variants.length];
        const product = await tx.product.findUniqueOrThrow({
          where: { id: variant.productId },
        });
        const quantity = i % 5 === 0 ? 2 : 1;
        const total =
          (channel === "online" ? product.onlinePrice : product.price) *
            quantity +
          (channel === "online" ? 500 : 0);
        const method = i % 2 ? "cash" : "card";
        const order = await sell(tx, {
          requestKey: `seed-sale-${i}`,
          channel,
          customerId: customers[i % customers.length].id,
          items: [{ variantId: variant.id, quantity }],
          payments: channel === "pos" ? [{ method, amount: total }] : [],
          cashTendered: total,
          demo: true,
        });
        const date = new Date();
        date.setUTCDate(
          date.getUTCDate() - (i < 4 ? 0 : i < 22 ? i - 3 : 35 + (i % 4)),
        );
        await tx.order.update({
          where: { id: order.id },
          data: {
            createdAt: date,
            ...(channel === "online" && i % 2 === 0
              ? { status: "packed" }
              : {}),
          },
        });
        await tx.journal.updateMany({
          where: { reference: `sale:${order.id}` },
          data: { date },
        });
      }
      const payments = await tx.payment.aggregate({
        where: { drawerId: drawer.id },
        _sum: { amount: true },
      });
      const expected = drawer.opening + (payments._sum.amount || 0);
      await tx.drawer.update({
        where: { id: drawer.id },
        data: {
          closedAt: new Date(),
          expected,
          counted: expected,
          variance: 0,
        },
      });
      await tx.supplier.createMany({
        data: [
          {
            name: "Little Threads Wholesale (Demo)",
            phone: "+961 70 000 020",
            email: "supplier@example.test",
            address: "Demo supplier address",
          },
          {
            name: "Playful Cotton Co. (Demo)",
            phone: "+961 70 000 021",
            email: "cotton@example.test",
          },
        ],
      });
      await tx.giftCard.create({
        data: { code: "DEMO-GIFT-50", balance: 5000, issued: 5000 },
      });
      await journal(tx, "demo-gift", "Demo gift card opening balance", [
        { accountId: "3000", debit: 5000 },
        { accountId: "2210", credit: 5000 },
      ]);
      await tx.promo.create({
        data: { code: "WELCOME10", kind: "percent", amount: 10, active: true },
      });
      await tx.setting.create({ data: { key: "seed-v1", value: true } });
      console.log(
        "Created clearly marked sample products, customers, sales, gift card and balanced journal entries.",
      );
    },
    { timeout: 120000 },
  );
await db.$disconnect();
