'use strict';

const db = require('./DB').db;

class RestockOrder {
    constructor(id, issueDate, state, supplierID, transportNote) {
        this.id = id;
        this.issueDate = issueDate;
        this.state = state;
        this.products = [];// contains products
        this.supplierID = supplierID;
        this.transportNote = transportNote;
        this.skuItems = []// contains skuItemsRequired by API
    }
}

/*************** Restock Order ********************/
exports.getRestockOrderProducts = (restock_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT ROP.skuID, ROP.quantity, S.description, S.price, ROP.itemId FROM RestockOrdersProducts ROP, SKUs S WHERE ROP.restockOrderID = ? AND ROP.itemId = S.id'
        db.all(sql, [restock_id], (err, rows) => {
            if (err)
                reject(err);
            else {
                const productsList = rows.map((row) => ({
                    SKUId: row.skuID,
                    itemId: row.itemId,
                    description: row.description,
                    price: row.price,
                    qty: row.quantity,
                }));
                resolve(productsList);
            }
        });
    });

}

exports.getRestockOrderSkuItems = (restock_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT ROSI.RFID, ROSI.itemId, SI.skuID FROM RestockOrdersSKUItems ROSI, SKUItems SI WHERE ROSI.RFID = SI.RFID AND restockOrderID = ?'
        db.all(sql, [restock_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const SKUItemList = rows.map((row) => ({
                    SKUId: row.skuID,
                    rfid: row.RFID,
                    itemId: row.itemId
                }));
                resolve(SKUItemList);
            }
        });

    });
}

exports.getRestockOrders = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM RestockOrders", [], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                const RestockOrders = rows.map(RO => new RestockOrder(RO.id, RO.issueDate, RO.state, RO.supplierID, RO.transportNote));
                resolve(RestockOrders);
            }
        });
    });
}

exports.getRestockOrdersIssued = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM RestockOrders WHERE state = 'ISSUED' ", [], (err, rows) => {
            if (err)
                reject(err);
            else {
                const RestockOrders = rows.map(RO => new RestockOrder(RO.id, RO.issueDate, RO.state, RO.supplierID, RO.transportNote));
                resolve(RestockOrders);
            }
        });
    });
}

exports.getRestockOrderById = (Id) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM RestockOrders WHERE id = ?", [Id], (err, row) => {
            if (err)
                reject(err);

            if (row == undefined)
                resolve({ error: 'Restock Order not found' });
            else {
                let RO = new RestockOrder(row.id, row.issueDate, row.state, row.supplierID, row.transportNote);
                resolve(RO);
            }
        });
    });
}

exports.getRestockOrderFailedSKUItems = (id) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT SI.skuID, RO.RFID, RO.itemId FROM TestResults TR, RestockOrdersSKUItems RO, SKUItems SI WHERE RO.RFID = TR.RFID AND RO.RFID = SI.RFID AND TR.RFID NOT IN (SELECT RFID FROM TestResults WHERE RESULT = 1) AND RO.restockOrderID = ? GROUP BY RO.RFID, RO.itemId, SI.skuID", [id], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

exports.getLastPIDInOrder = (orderId) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT productID as id FROM RestockOrdersProducts WHERE restockOrderID = ? ORDER BY id DESC LIMIT 1", [orderId], (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row == undefined ? 0 : row.id);
        });
    });
}

exports.insertProductInOrder = (id, restockOrderId, skuID, itemId, qty) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO RestockOrdersProducts (productID, restockOrderID, skuID, itemId, quantity) VALUES (?,?,?,?,?)';
        db.run(sql, [id, restockOrderId, skuID, itemId, qty], (err, row) => {
            if (err)
                reject(err);
            else
                resolve(null);
        });
    });
}

exports.getLastIdRsO = () => {
    return new Promise((resolve, reject) => {
        db.get("SELECT id FROM RestockOrders ORDER BY id DESC LIMIT 1", [], (err, row) => {
            if (err) {
                reject(err);
            }
            else
                resolve(row == undefined ? 0 : row.id);
        });
    });
}

//need to create an entry for each item in the corresponding table.
// need to see where to put product description consider creating a class product
exports.createRestockOrder = (issueDate, supplierId, id) => {
    return new Promise((resolve, reject) => {
        db.run("REPLACE INTO RestockOrders (id, issueDate, state, supplierID) VALUES (?, ?, ?, ?)",
            [id, issueDate, 'ISSUED', supplierId], function (err) {
                if (err)
                    reject(err);
                else
                    resolve('New RestockOrder inserted');
            }
        );
    });
}

exports.removeSKUItemFromRestockOrder = (skuId, id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM RestockOrdersSKUItems WHERE restockOrderID = ? AND RFID = ?",
            [id, skuId], function (err) {
                if (err)
                    reject(err);
                else
                    resolve('Item Deleted from RestockOrder');
            }
        );
    });

}

exports.modifyRestockOrderState = (id, newState) => {
    return new Promise((resolve, reject) => {
        db.run("UPDATE RestockOrders SET state = ? WHERE id = ?",
            [newState, id], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve('modified state to ' + newState);
            });
    });
}

exports.addRestockOrderSKUItems = (restockOrderID, RFID, itemId) => {
    return new Promise(async (resolve, reject) => {
        db.run("INSERT INTO RestockOrdersSKUItems (restockOrderID, RFID, itemId) VALUES (?, ?, ?)",
            [restockOrderID, RFID, itemId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve('New RestockOrder SKU Item inserted');
            });
    });
}

// for now Transport note is A string should fix it to have it in its own table
exports.addRestockOrderTransportNote = (id, transportNote) => {
    return new Promise((resolve, reject) => {
        db.run("REPLACE INTO RestockOrderTransportNote (RestockOrderID,DeliveryDate) VALUES (?,?)",
            [id, transportNote.deliveryDate], function (err) {
                if (err)
                    reject(err);
                else
                    resolve('RequestOrders updated');
            });
    });
}

exports.getRestockOrderTransportNote = (id) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT deliveryDate FROM RestockOrderTransportNote WHERE RestockOrderID = ?", [id], (err, rows) => {
            if (err) {
                reject(err);
            }
            if (rows == undefined)
                resolve({ error: 'Transport note not found' });
            else if (rows.deliveryDate == undefined)
                resolve(null);
            else
                resolve({ 'deliveryDate': rows.deliveryDate });
        });
    });
}

exports.deleteRestockOrder = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM RestockOrders WHERE id = ?", [id], function (err) {
            if (err)
                reject(err);
            else
                resolve('deleted Restock Order');
        });
    });

};

exports.deleteSkuItemsFromRestockOrder = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM RestockOrdersSKUItems WHERE restockOrderID = ?", [id], function (err) {
            if (err)
                reject(err);
            else
                resolve('Deleted');
        });
    });
}

exports.deleteRestockOrderTransportNote = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM RestockOrderTransportNote WHERE restockOrderID = ?", [id], function (err) {
            if (err)
                reject(err);
            else
                resolve('Deleted');
        });
    });
}

exports.deleteProductsFromRestockOrder = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM RestockOrdersProducts WHERE restockOrderID = ?",
            [id], function (err) {
                if (err) {
                    reject(err);
                }
                else
                    resolve('Deleted');
            });
    });
}

exports.getSKUByIdFromRestockOrder = (skuId, restockOrderId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM RestockOrdersProducts WHERE restockOrderID = ? AND skuID = ?';
        db.get(sql, [restockOrderId, skuId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (row == undefined)
                resolve({ error: 'SKU not found.' });
            else resolve(row);
        });
    });
}

exports.getRFIDFromRestockOrder = (RFID, restockOrderId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM RestockOrdersSKUItems WHERE restockOrderID = ? AND RFID = ?';
        db.get(sql, [restockOrderId, RFID], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (row == undefined)
                resolve({ error: 'RFID not found in Restock Order' });
            else resolve(row);
        });
    });
}

exports.deleteAllRestockOrders = () => {
    return new Promise(async (resolve, reject) => {
        db.run("DELETE FROM RestockOrders", [], function (err) {
            if (err)
                reject(err);
            else
                resolve('All RestockOrders deleted');
        });
    });
}
exports.deleteAllRestockOrdersProducts = () => {
    return new Promise(async (resolve, reject) => {
        db.run("DELETE FROM RestockOrdersProducts", [], function (err) {
            if (err)
                reject(err);
            else
                resolve('All RestockOrders Products deleted');
        });
    });
}
exports.deleteAllRestockOrdersSKUItems = () => {
    return new Promise(async (resolve, reject) => {
        db.run("DELETE FROM RestockOrdersSKUItems", [], function (err) {
            if (err)
                reject(err);
            else
                resolve('All Restock Orders SKUItems deleted');
        });
    });
}
exports.deleteAllRestockOrderTransportNote = () => {
    return new Promise(async (resolve, reject) => {
        db.run("DELETE FROM RestockOrderTransportNote", [], function (err) {
            if (err)
                reject(err);
            else
                resolve('All Restock Order Transport notes deleted');
        });
    });
}
