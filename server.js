const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Harish@2006",   
    database: "homesupply",
    port: 3306
});

db.connect((err) => {
    if (err) console.log("DB Error:", err);
    else console.log("MySQL Connected...");
});

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Database error" });
        }
        if (result.length > 0) {
            res.status(200).json({ message: "Login successful" });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    });
});

app.post('/customer/add', (req, res) => {

    const { customer_name } = req.body;

    const checkSql =
    "SELECT * FROM customers WHERE customer_name=?";

    db.query(checkSql,[customer_name],(err,result)=>{

        if(err) return res.status(500).send(err);

        if(result.length>0){

            return res.status(400).json({
                message:"Customer already exists."
            });

        }

        db.query(
            "INSERT INTO customers(customer_name) VALUES(?)",
            [customer_name],
            (err)=>{

                if(err) return res.status(500).send(err);

                res.json({
                    message:"Customer Added Successfully."
                }); 

            });

    });

});

app.get("/customer/data", (req, res) => {

    db.query(
        "SELECT * FROM customers ORDER BY customer_name ASC",
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);

        }
    );

});

app.put("/customer/update/:id", (req, res) => {

    const { customer_name } = req.body;

    db.query(

        "UPDATE customers SET customer_name=? WHERE id=?",

        [customer_name, req.params.id],

        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Customer Updated Successfully"
            });

        }

    );

});

app.delete("/customer/delete/:id", (req, res) => {

    db.query(

        "DELETE FROM customers WHERE id=?",

        [req.params.id],

        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Customer Deleted Successfully"
            });

        }

    );

});
app.post("/item/add", (req, res) => {

    const { item_name } = req.body;

    db.query(
        "SELECT * FROM item_master WHERE item_name=?",
        [item_name],
        (err, result) => {

            if(err) return res.status(500).json(err);

            if(result.length>0){
                return res.json({
                    message:"Item already exists"
                });
            }

            db.query(
                "INSERT INTO item_master(item_name) VALUES(?)",
                [item_name],
                (err)=>{

                    if(err) return res.status(500).json(err);

                    res.json({
                        message:"Item Added Successfully"
                    });

                });

        });

});

app.get("/item/data",(req,res)=>{

    db.query(
        "SELECT * FROM item_master ORDER BY item_name ASC",
        (err,result)=>{

            if(err) return res.status(500).json(err);

            res.json(result);

        });

});

app.delete("/item/delete/:id",(req,res)=>{

    db.query(
        "DELETE FROM item_master WHERE id=?",
        [req.params.id],
        (err)=>{

            if(err) return res.status(500).json(err);

            res.json({
                message:"Deleted Successfully"
            });

        });

});

app.put("/item/update/:id",(req,res)=>{

    const {item_name}=req.body;

    db.query(
        "UPDATE item_master SET item_name=? WHERE id=?",
        [item_name,req.params.id],
        (err)=>{

            if(err) return res.status(500).json(err);

            res.json({
                message:"Updated Successfully"
            });

        });

});



app.post('/out/add', (req, res) => {
    const { name, date, sudam, qty } = req.body;
    const checkSql = `
        SELECT * FROM supply_out
        WHERE name=? AND sudam=? AND date=?
    `;

    db.query(checkSql, [name, sudam, date], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) {
            return res.status(400).json({ message: "This data is already entered." });
        }

        const insertSql = `
            INSERT INTO supply_out(name,date,sudam,qty)
            VALUES(?,?,?,?)
        `;
        db.query(insertSql, [name, date, sudam, qty], (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: err.message });
            }
            res.status(200).json({ message: "Out entry added successfully." });
        });
    });
});

app.get('/out/data', (req, res) => {

    const sql = `
    SELECT
        o.id,
        o.name,
        o.sudam,
        o.qty,
        DATE_FORMAT(o.date,'%Y-%m-%d') AS date,

        IFNULL(SUM(i.qty),0) AS receivedQty,

        (o.qty - IFNULL(SUM(i.qty),0)) AS pendingQty

    FROM supply_out o

    LEFT JOIN supply_in i
        ON o.name = i.name
        AND o.sudam = i.sudam

    GROUP BY
        o.id,
        o.name,
        o.sudam,
        o.qty,
        o.date

    ORDER BY o.id DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(result);

    });

});

app.delete('/out/delete/:id', (req, res) => {
    db.query("DELETE FROM supply_out WHERE id=?", [req.params.id], (err) => {
        if (err) return res.send("Error deleting");
        res.send("OUT Deleted");
    });
});

app.put('/out/update/:id', (req, res) => {
    const { name, date, sudam, qty } = req.body;
    const sql = `
        UPDATE supply_out 
        SET name=?, date=?, sudam=?, qty=? 
        WHERE id=?
    `;
    db.query(sql, [name, date, sudam, qty, req.params.id], (err) => {
        if (err) return res.send(err);
        res.json({
        message: "OUT Updated Successfully"
     });
    });
});
app.post('/in/add', (req, res) => {

    const { name, date, sudam, qty } = req.body;

    const findOut = `
        SELECT
            SUM(qty) AS totalQty,
            MIN(date) AS firstDate
        FROM supply_out
        WHERE name=? AND sudam=?
    `;

    db.query(findOut, [name, sudam], (err, result) => {

        if (err) return res.status(500).send(err);

        const outData = result[0];

        if (!outData.totalQty) {
            return res.status(400).json({
                message: "No OUT records found"
            });
        }

        const totalOutQty = Number(outData.totalQty);

        const outDate = new Date(outData.firstDate);
        const inDate = new Date(date);

        const diffTime = inDate - outDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const inSql = `
            SELECT SUM(qty) AS receivedQty
            FROM supply_in
            WHERE name=? AND sudam=?
        `;

        db.query(inSql, [name, sudam], (err, inResult) => {

            if (err) return res.status(500).send(err);

            const alreadyReceived = Number(inResult[0].receivedQty) || 0;

            const receiveQty = Number(qty);

            const pendingQty = totalOutQty - alreadyReceived;

            if (receiveQty > pendingQty) {
                return res.status(400).json({
                    message: `Only ${pendingQty} Qty Pending`
                });
            }

            const newTotalReceived = alreadyReceived + receiveQty;

            const qtyDiff = totalOutQty - newTotalReceived;

            const insertSql = `
                INSERT INTO supply_in
                (name, date, sudam, qty, days_taken, qty_difference)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    name,
                    date,
                    sudam,
                    receiveQty,
                    diffDays,
                    qtyDiff
                ],
                (err) => {

                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: err.message
                        });
                    }

                    res.status(200).json({
                        message: "Received Successfully",
                        pending: qtyDiff
                    });

                }
            );

        });

    });

});
app.get('/in/data', (req, res) => {

    const sql = `
    SELECT
        id,
        name,
        sudam,
        qty,
        days_taken,
        qty_difference,
        DATE_FORMAT(date,'%Y-%m-%d') AS date
    FROM supply_in
    ORDER BY id DESC
    `;

    db.query(sql, (err, result) => {

        if (err) return res.send(err);

        res.json(result);

    });

});

app.delete('/in/delete/:id', (req, res) => {
    db.query("DELETE FROM supply_in WHERE id=?", [req.params.id], (err) => {
        if (err) return res.send("Error deleting");
        res.send("IN Deleted");
    });
});

app.put('/in/update/:id', (req, res) => {
    const { name, date, sudam, qty } = req.body;
    const sql = `
        UPDATE supply_in 
        SET name=?, date=?, sudam=?, qty=? 
        WHERE id=?
    `;
    db.query(sql, [name, date, sudam, qty, req.params.id], (err) => {
        if (err) return res.send(err);
        res.send("IN Updated");
    });
});

app.get('/balance/data', (req, res) => {
    const { name, item } = req.query;

    let outWhere = "";
    let inWhere = "";

    if (name) {
        outWhere += " AND name LIKE ?";
        inWhere += " AND name LIKE ?";
    }

    if (item) {
        outWhere += " AND sudam LIKE ?";
        inWhere += " AND sudam LIKE ?";
    }

    const sql = `
        SELECT
            combined.name,
            combined.sudam AS item,
            SUM(combined.out_qty) AS total_out,
            SUM(combined.in_qty) AS total_in,
            (SUM(combined.out_qty) - SUM(combined.in_qty)) AS balance
        FROM (
            SELECT
                name,
                sudam,
                qty AS out_qty,
                0 AS in_qty
            FROM supply_out
            WHERE 1=1 ${outWhere}

            UNION ALL

            SELECT
                name,
                sudam,
                0 AS out_qty,
                qty AS in_qty
            FROM supply_in
            WHERE 1=1 ${inWhere}
        ) AS combined
        GROUP BY combined.name, combined.sudam
        ORDER BY combined.name ASC
    `;

    let finalParams = [];

    if (name && item) {
        finalParams = [`%${name}%`, `%${item}%`, `%${name}%`, `%${item}%`];
    } else if (name) {
        finalParams = [`%${name}%`, `%${name}%`];
    } else if (item) {
        finalParams = [`%${item}%`, `%${item}%`];
    }

    db.query(sql, finalParams, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        let totalOutSum = 0;
        let totalInSum = 0;
        const uniqueCustomers = new Set();

        result.forEach(row => {
            totalOutSum += Number(row.total_out) || 0;
            totalInSum += Number(row.total_in) || 0;
            uniqueCustomers.add(row.name);
        });

        const totalBalanceSum = totalOutSum - totalInSum;

        res.json({
            records: result,
            summary: {
                totalCustomers: uniqueCustomers.size,
                globalTotalOut: totalOutSum,
                globalTotalIn: totalInSum,
                globalTotalBalance: totalBalanceSum
            }
        });
    });
});

app.get("/customers", (req, res) => {

    const sql = `
        SELECT
            id,
            customer_name AS name
        FROM customers
        ORDER BY customer_name ASC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(result);

    });

});
app.get("/items", (req, res) => {

    const sql = `
        SELECT
            id,
            item_name AS name
        FROM item_master
        ORDER BY item_name ASC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(result);

    });

});

app.listen(3000, () => {
    console.log("✅ Server running on http://localhost:3000");
});