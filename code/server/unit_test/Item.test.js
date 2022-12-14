//npm test -- --runInBand

const Item = require('../modules/Item');
const database = require("../modules/DB");

beforeAll(async () => {
    await database.createConnection();
    await new Promise(process.nextTick);
});
afterAll(async () => {
    await new Promise(process.nextTick);
});

describe("Create a new Item", () => {
    beforeEach(async () => {
        await Item.deleteAllItems();
    });

    afterEach(async () => {
        await Item.deleteAllItems();
    });
    test('get all Items with an empty list', async () => {
        await expect(Item.getAllItems()).resolves.toEqual([]);
    });

    test("new Item creation", async () => {
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).resolves.toEqual("New Item inserted");

        // Check if they are really the ones created
        await expect(Item.getItemByIdAndSupplierId(1, 1)).resolves.toEqual({ "id": 1, "price": 10, "supplierId": 1, "description": "an Item", "SKUId": 1 });
    });

    test("two new Item created", async () => {
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(2, 10, 2, 1, "an Item")).resolves.toEqual("New Item inserted");

        // Check if they are really the ones created
        await expect(Item.getAllItems()).resolves.toEqual([{ "id": 1, "price": 10, "supplierId": 1, "description": "an Item", "SKUId": 1 }, { "id": 2, "price": 10, "supplierId": 1, "description": "an Item", "SKUId": 2 }]);
    });

    test("Item creation error: id duplicated", async () => {
        await Item.createNewItem(1, 10, 1, 1, "an Item");
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).rejects.toThrow();
    });

});

describe("Get all Items", () => {
    beforeEach(async () => {
        await Item.deleteAllItems();
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(2, 10, 2, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(3, 10, 3, 1, "an Item")).resolves.toEqual("New Item inserted");
    });

    afterEach(async () => {
        await Item.deleteAllItems();
    });

    testAllItems(1, 10, 1, 1, "an Item",
        2, 10, 2, 1, "an Item",
        3, 10, 3, 1, "an Item");
});

describe("Get Item by ID", () => {
    beforeEach(async () => {
        await Item.deleteAllItems();
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(2, 10, 2, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(3, 10, 3, 1, "an Item")).resolves.toEqual("New Item inserted");
    });

    afterEach(async () => {
        await Item.deleteAllItems();
    });

    testItem(1, 10, 1, 1, "an Item");
    testItem(2, 10, 2, 1, "an Item");
    testItem(3, 10, 3, 1, "an Item");

    test("Get Item: not found", async () => {
        const res = await Item.getItemByIdAndSupplierId(9, 1)
        expect(res).toEqual({ error: 'ID not found.' });
    });
});

describe("Get Item by Supplier Id and SkuId", () => {
    beforeEach(async () => {
        await Item.deleteAllItems();
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(2, 10, 2, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(3, 10, 3, 1, "an Item")).resolves.toEqual("New Item inserted");
    });

    afterEach(async () => {
        await Item.deleteAllItems();
    });

    testGetItemBySupplierIdAndSKUId(1, 10, 1, 1, "an Item");
    testGetItemBySupplierIdAndSKUId(2, 10, 2, 1, "an Item");
    testGetItemBySupplierIdAndSKUId(3, 10, 3, 1, "an Item");

    test("Get Item: not found", async () => {
        const res = await Item.getItemBySupplierIdAndSKUId(9, 1)
        expect(res).toEqual({ error: 'ID not found.' });
    });
});

describe("Modify Item", () => {
    beforeEach(async () => {
        await Item.deleteAllItems();
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).resolves.toEqual("New Item inserted");
    });

    afterEach(async () => {
        await Item.deleteAllItems();
    });

    test("modify an Item", async () => {
        await Item.modifyItem(1, 20, 3, 1, "another Item");
        const res = await Item.getItemByIdAndSupplierId(1, 1);
        expect(res).toEqual({ "id": 1, "price": 20, "supplierId": 1, "description": "another Item", "SKUId": 3 });
    });
});

describe("Delete an Item", () => {
    beforeEach(async () => {
        await Item.deleteAllItems();
        await expect(Item.createNewItem(1, 10, 1, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(2, 10, 2, 1, "an Item")).resolves.toEqual("New Item inserted");
        await expect(Item.createNewItem(3, 10, 3, 1, "an Item")).resolves.toEqual("New Item inserted");
    });

    afterEach(async () => {
        await Item.deleteAllItems();
    });

    test("delete Item", async () => {
        await Item.deleteItemByIDAndSupplierId(3, 1)
        const res = await Item.getItemByIdAndSupplierId(3, 1);
        expect(res).toEqual({ error: 'ID not found.' });
    });
});

async function testAllItems(id, price, skuId, supplierId, description,
    id2, price2, skuId2, supplierId2, description2,
    id3, price3, skuId3, supplierId3, description3,) {
    test('get all Items', async () => {
        let res = await Item.getAllItems();
        expect(res).toEqual([
            { "id": id, "price": price, "supplierId": supplierId, "description": description, "SKUId": skuId },
            { "id": id2, "price": price2, "supplierId": supplierId2, "description": description2, "SKUId": skuId2 },
            { "id": id3, "price": price3, "supplierId": supplierId3, "description": description3, "SKUId": skuId3 }
        ]);
    });
}

async function testItem(id, price, skuId, supplierId, description) {
    test('get an Item', async () => {
        let res = await Item.getItemByIdAndSupplierId(id, supplierId);
        expect(res).toEqual({ "id": id, "price": price, "supplierId": supplierId, "description": description, "SKUId": skuId });
    });
}

async function testGetItemBySupplierIdAndSKUId(id, price, skuId, supplierId, description) {
    test('get an Item by Id and SKUId', async () => {
        let res = await Item.getItemBySupplierIdAndSKUId(id, supplierId, skuId);
        expect(res).toEqual({ "id": id, "price": price, "supplierId": supplierId, "description": description, "SKUId": skuId });
    });
}