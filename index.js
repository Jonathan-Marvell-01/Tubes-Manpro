
// WP 2.4.1 START: Filbert
// Commit Message: feat(auth): setup backend entry point, implementasi login dan registration logic (WP 2.4.1)
// Commit to branch feature/auth-backend

import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import flash from "connect-flash";
import { connect, initDB } from "./db.js";

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "your-secret", resave: false, saveUninitialized: true }));
app.use(flash());
app.use(express.json());

// Route untuk halaman utama (login) DONE
app.get("/", (req, res) => {
  res.render("index.ejs", { error: req.flash("error").length > 0 });
});

// Route untuk logout DONE
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Logout failed");
    }
    res.redirect("/");
  });
});

// Tangani POST dari form login DONE
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === "owner" && password === "password123") {
    res.redirect("/owner/dashboard");
  } else if (username === "owner" && password !== "password123") {
    req.flash("error", true);
    res.redirect("/");
  } else {
    try {
      const pool = connect(); // Ambil pool

      // MENGUBAH: Syntax query menggunakan ? dan array parameter
      const sqlQuery = "SELECT id_asisten, nama_asisten, password FROM Asisten WHERE nama_asisten = ?";
      const [rows] = await pool.execute(sqlQuery, [username]);

      // MENGUBAH: result.recordset menjadi rows
      if (rows.length == 0) {
        req.flash("error", true);
        res.redirect("/");
      } else {
        if (rows[0].password == password) {
          req.session.assistantName = username;
          req.session.idAsisten = rows[0].id_asisten;
          res.redirect("/assistant/dashboard");
        } else {
          res.render("index.ejs", { error: true });
        }
      }
    } catch (err) {
      console.log(err.message);
    }
  }
});

// WP 2.4.1 END

// ------------------------ ASSISTANT INTERFACE -------------------------

// Route untuk halaman dashboard client DONE
app.get("/assistant/dashboard", (req, res) => {
  res.render("dashboardass.ejs", {
    title: "Dashboard Assistant",
    name: req.session.assistantName,
    active: 1,
  });
});

// Route untuk halaman manage client DONE
app.get("/assistant/mngclient", async (req, res) => {
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 7;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || ""; 

  try {
    const pool = connect();

    // MENGUBAH: SQL Concatenation MSSQL (+) menjadi MySQL (CONCAT)
    const sqlQuery = "SELECT * FROM Klien WHERE is_active = 1 AND nama LIKE CONCAT('%', ?, '%')";
    const [rows] = await pool.execute(sqlQuery, [search]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    res.render("layout-client.ejs", {
      title: "Manage Client",
      heading: "Client List",
      columns: ["Edit", "Name", "Address", "Contact"],
      clients: paginated,
      active: 2,
      currentPage: page,
      totalPages: totalPages,
      status: status,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk halaman add client DONE
app.get("/assistant/mngclient/add-client", (req, res) => {
  res.render("layout-add.ejs", {
    title: "Add Client",
    heading: "Add Client",
    formAction: "/assistant/mngclient/add-client",
    fields: [
      { label: "Client Name", name: "clientName", placeholder: "name..." },
      { label: "Client Address", name: "clientAddress", placeholder: "address..." },
      { label: "Client Contact", name: "clientContact", placeholder: "contact..." },
    ],
    active: 2,
    mode: "add",
  });
});

// Route untuk halaman edit client DONE
app.get("/assistant/mngclient/edit-client/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();
    const [rows] = await pool.execute("SELECT * FROM Klien WHERE id_klien = ?", [id]);

    res.render("layout-add.ejs", {
      title: "Edit Client",
      heading: "Edit Client",
      formAction: "/assistant/mngclient/edit-client/" + id,
      formDeleteAction: "/assistant/mngclient/delete-client/" + id,
      fields: [
        { label: "Client Name", name: "clientName", placeholder: "name...", value: rows[0].nama },
        { label: "Client Address", name: "clientAddress", placeholder: "address...", value: rows[0].alamat },
        { label: "Client Contact", name: "clientContact", placeholder: "contact...", value: rows[0].kontak },
      ],
      active: 2,
      mode: "edit",
      id: id,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk halaman manage event DONE
app.get("/assistant/mngevent", async (req, res) => {
  const assistant = req.session.assistantName;
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 7;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || ""; 

  try {
    const pool = connect();

    // MENGUBAH: DATE_FORMAT untuk MySQL dan CONCAT untuk search
    const sqlQuery = `
      SELECT Event.id_event, Klien.nama, DATE_FORMAT(Event.tanggal, '%Y-%m-%d') AS tanggal, Event.Status 
      FROM (SELECT * FROM MenyelenggarakanEvent WHERE id_asisten = ?) AS t2 
      INNER JOIN Event ON t2.id_event = Event.id_event 
      INNER JOIN Klien ON t2.id_klien = Klien.id_klien 
      WHERE Klien.nama LIKE CONCAT('%', ?, '%') AND Event.is_active = 1 
      ORDER BY Event.status DESC`;
      
    const [rows] = await pool.execute(sqlQuery, [req.session.idAsisten, search]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    res.render("layout-event.ejs", {
      title: "Event List",
      heading: assistant + "'s Event List",
      columns: ["Edit", "Client", "Date", "Status", ""],
      events: paginated,
      active: 3,
      currentPage: page,
      totalPages: totalPages,
      status: status,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk halaman add event DONE
app.get("/assistant/mngevent/add-event", async (req, res) => {
  try {
    const pool = connect();

    const [rowsJenis] = await pool.execute("SELECT * FROM JenisEvent");
    const [rowsKlien] = await pool.execute("SELECT id_klien, nama FROM Klien WHERE is_active = 1");

    res.render("layout-add.ejs", {
      title: "Add Event",
      heading: "Add Event",
      formAction: "/assistant/mngevent/add-event",
      fields: [
        { label: "Client Name", name: "clientID", type: "autocomplete", placeholder: "client name...", options: rowsKlien },
        { label: "Invitation Amount", name: "invAmount", placeholder: "invitation amount..." },
        { label: "Event Date", name: "eventDate", placeholder: "YYYY-MM-DD" },
        {
          label: "Event Status",
          name: "eventStatus",
          type: "select",
          options: ["Not Started", "On Process", "Finished"],
        },
        {
          label: "Event Type",
          name: "eventType",
          type: "select",
          options: rowsJenis,
        },
      ],
      active: 3,
      mode: "add",
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk halaman edit event DONE
app.get("/assistant/mngevent/edit-event/:idEvent", async (req, res) => {
  try {
    const pool = connect();

    const [rowsJenis] = await pool.execute("SELECT * FROM JenisEvent");
    const [rowsKlien] = await pool.execute("SELECT id_klien, nama FROM Klien WHERE is_active = 1");
    
    // MENGUBAH: DATE_FORMAT
    const sqlDetail = `
      SELECT Klien.nama, t2.jumlah_undangan, DATE_FORMAT(t2.tanggal, '%Y-%m-%d') AS tanggal, t2.status, JenisEvent.nama_jenis 
      FROM (SELECT * FROM Event WHERE id_event = ?) AS t2 
      INNER JOIN JenisEvent ON t2.id_jenis = JenisEvent.id_jenis 
      INNER JOIN MenyelenggarakanEvent ON t2.id_event = MenyelenggarakanEvent.id_event 
      INNER JOIN Klien ON MenyelenggarakanEvent.id_klien = Klien.id_klien`;
      
    const [rowsDetail] = await pool.execute(sqlDetail, [req.params.idEvent]);

    res.render("layout-add.ejs", {
      title: "Edit Event",
      heading: "Edit Event",
      formAction: "/assistant/mngevent/edit-event/" + req.params.idEvent,
      formDeleteAction: "/assistant/mngevent/delete-event/" + req.params.idEvent,
      fields: [
        { label: "Client Name", name: "clientID", type: "autocomplete", placeholder: "client name...", options: rowsKlien, value: rowsDetail[0].nama },
        { label: "Invitation Amount", name: "invAmount", placeholder: "invitation amount...", value: rowsDetail[0].jumlah_undangan },
        { label: "Event Date", name: "eventDate", placeholder: "YYYY-MM-DD", value: rowsDetail[0].tanggal },
        {
          label: "Event Status",
          name: "eventStatus",
          type: "select",
          options: ["Not Started", "On Process", "Finished"],
          value: rowsDetail[0].status,
        },
        {
          label: "Event Type",
          name: "eventType",
          type: "select",
          options: rowsJenis,
          value: rowsDetail[0].nama_jenis,
        },
      ],
      active: 3,
      mode: "edit",
      id: req.params.idEvent,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk halaman detail event DONE
app.get("/assistant/mngevent/detail/:id", async (req, res) => {
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 7;
  const page = parseInt(req.query.page) || 1;

  try {
    const pool = connect();

    const sqlVendors = `
      SELECT Vendor.id_vendor, Vendor.nama_vendor, KategoriVendor.nama_kategori, EventVendor.harga_dealing, Vendor.harga_min, Vendor.harga_max 
      FROM (SELECT * FROM Event WHERE id_event = ?) AS e 
      INNER JOIN EventVendor ON EventVendor.id_event = e.id_event 
      INNER JOIN Vendor ON EventVendor.id_vendor = Vendor.id_vendor 
      INNER JOIN KategoriVendor ON KategoriVendor.id_kategori = Vendor.id_kategori`;

    const [rows] = await pool.execute(sqlVendors, [req.params.id]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    const sqlTotal = `SELECT SUM(EventVendor.harga_dealing) AS 'TotalFix' FROM(SELECT * FROM Event WHERE id_event = ?) AS e INNER JOIN EventVendor ON EventVendor.id_event = e.id_event`;
    const [totalFix] = await pool.execute(sqlTotal, [req.params.id]);

    const sqlHeading = `
      SELECT Klien.nama, JenisEvent.nama_jenis 
      FROM (SELECT * FROM Event WHERE id_event = ?) AS e 
      INNER JOIN MenyelenggarakanEvent ON e.id_event = MenyelenggarakanEvent.id_event 
      INNER JOIN JenisEvent ON e.id_jenis = JenisEvent.id_jenis 
      INNER JOIN Klien ON MenyelenggarakanEvent.id_klien = Klien.id_klien`;
      
    const [heading] = await pool.execute(sqlHeading, [req.params.id]);

    res.render("detail-event.ejs", {
      title: "Event - Vendor Detail",
      heading: heading[0].nama + "'s " + heading[0].nama_jenis,
      columns: ["Vendor", "Type", "Price", "Status"],
      vendors: paginated,
      active: 3,
      status: status,
      currentPage: page,
      totalPages: totalPages,
      totalFix: totalFix[0].TotalFix || 0,
      idEvent: req.params.id,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk halaman detail event - add vendor
app.get("/assistant/mngevent/detail/add-vendor/:idEvent", async (req, res) => {
  try {
    const pool = connect();
    const [rows] = await pool.execute("SELECT id_vendor, nama_vendor FROM Vendor");

    res.render("addEventVendor.ejs", {
      title: "Add new Vendor",
      active: 3,
      vendors: rows,
      idEvent: req.params.idEvent,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk halaman detail event - edit vendor DONE
app.get("/assistant/mngevent/detail/edit-vendor/:idEvent/:idVendor", async (req, res) => {
  try {
    const pool = connect();
    const [rows] = await pool.execute(
        "SELECT harga_dealing FROM EventVendor WHERE id_event = ? AND id_vendor = ?", 
        [req.params.idEvent, req.params.idVendor]
    );

    res.render("editEventVendor.ejs", {
      idEvent: req.params.idEvent,
      idVendor: req.params.idVendor,
      title: "Edit Vendor",
      active: 3,
      isFix: rows[0].harga_dealing != null,
      hargaDealing: rows[0].harga_dealing,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// --------------------------- POST HANDLING -----------------------------

// POST dari form add client DONE
app.post("/assistant/mngclient/add-client", async (req, res) => {
  const { clientName, clientAddress, clientContact } = req.body;

  try {
    const pool = connect();

    // MENGUBAH: Insert dan cek affectedRows
    const [result] = await pool.execute(
        "INSERT INTO Klien(nama, alamat, kontak) VALUES(?, ?, ?)", 
        [clientName, clientAddress, clientContact]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Client Successfully Added!");
      res.redirect("/assistant/mngclient");
    }
  } catch (err) {
    req.flash("status", "Client Cannot Be Added!");
    res.redirect("/assistant/mngclient");
    console.log(err.message);
  }
});

// POST dari form edit client DONE
app.post("/assistant/mngclient/edit-client/:id", async (req, res) => {
  const { clientName, clientAddress, clientContact } = req.body;
  const id = req.params.id;

  try {
    const pool = connect();

    const [result] = await pool.execute(
        "UPDATE Klien SET nama = ?, alamat = ?, kontak = ? WHERE id_klien = ?",
        [clientName, clientAddress, clientContact, id]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Client Successfully Updated!");
      res.redirect("/assistant/mngclient");
    }
  } catch (err) {
    req.flash("status", "Client Cannot Be Updated!");
    res.redirect("/assistant/mngclient");
    console.log(err.message);
  }
});

// POST dari form edit - delete client DONE
app.post("/assistant/mngclient/delete-client/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();
    const [result] = await pool.execute("UPDATE Klien SET is_active = 0 WHERE id_klien = ?", [id]);

    if (result.affectedRows == 1) {
      req.flash("status", "Client Successfully Deleted!");
      res.redirect("/assistant/mngclient");
    }
  } catch (err) {
    req.flash("status", "Client Cannot Be Deleted!");
    res.redirect("/assistant/mngclient");
    console.log(err.message);
  }
});

// POST dari form add event DONE
app.post("/assistant/mngevent/add-event", async (req, res) => {
  const { clientID, invAmount, eventDate, eventStatus, eventType } = req.body;
  const idAsisten = req.session.idAsisten;

  try {
    const pool = connect();

    // MENGUBAH: Menggunakan insertId dari MySQL
    const [result] = await pool.execute(
        "INSERT INTO Event(tanggal, jumlah_undangan, status, id_jenis) VALUES(?, ?, ?, ?)",
        [eventDate, invAmount, eventStatus, eventType]
    );

    const idEvent = result.insertId; // ID Event yang baru saja dibuat
    console.log("New Event ID:", idEvent);

    const [result2] = await pool.execute(
        "INSERT INTO MenyelenggarakanEvent(id_event, id_klien, id_asisten) VALUES(?, ?, ?)",
        [idEvent, clientID, idAsisten]
    );

    if (result.affectedRows == 1 && result2.affectedRows == 1) {
      req.flash("status", "Event Successfully Added!");
      res.redirect("/assistant/mngevent");
    }
  } catch (err) {
    req.flash("status", "Event Cannot Be Added!");
    res.redirect("/assistant/mngevent");
    console.log(err.message);
  }
});

// POST dari form edit event DONE
app.post("/assistant/mngevent/edit-event/:id", async (req, res) => {
  const { clientID, invAmount, eventDate, eventStatus, eventType } = req.body;
  const id = req.params.id;

  try {
    const pool = connect();

    const [result] = await pool.execute(
        "UPDATE Event SET tanggal = ?, jumlah_undangan = ?, status = ?, id_jenis = ? WHERE id_event = ?",
        [eventDate, invAmount, eventStatus, eventType, id]
    );

    const [result2] = await pool.execute(
        "UPDATE MenyelenggarakanEvent SET id_klien = ? WHERE id_event = ?",
        [clientID, id]
    );

    if (result.affectedRows == 1 && result2.affectedRows == 1) {
      req.flash("status", "Event Successfully Updated!");
      res.redirect("/assistant/mngevent");
    }
  } catch (err) {
    req.flash("status", "Event Cannot Be Updated!");
    res.redirect("/assistant/mngevent");
    console.log(err.message);
  }
});

// POST dari form edit - delete event DONE
app.post("/assistant/mngevent/delete-event/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();
    const [result] = await pool.execute("UPDATE Event SET is_active = 0 WHERE id_event = ?", [id]);

    if (result.affectedRows == 1) {
      req.flash("status", "Event Successfully Deleted!");
      res.redirect("/assistant/mngevent");
    }
  } catch (err) {
    req.flash("status", "Event Cannot Be Deleted!");
    res.redirect("/assistant/mngevent");
    console.log(err.message);
  }
});

// POST dari halaman detail event - add vendor DONE
app.post("/assistant/mngevent/detail/add-vendor/:idEvent", async (req, res) => {
  const idEvent = req.params.idEvent;
  const idVendor = req.body.vendorId;

  try {
    const pool = connect();
    const [result] = await pool.execute(
        "INSERT INTO EventVendor(id_event, id_vendor) VALUES(?, ?)", 
        [idEvent, idVendor]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Successfully Added!");
      res.redirect("/assistant/mngevent/detail/" + idEvent);
    }
  } catch (err) {
    req.flash("status", "Vendor Cannot Be Added!");
    res.redirect("/assistant/mngevent/detail/" + idEvent);
    console.log(err.message);
  }
});

// POST dari halaman detail event - edit vendor DONE
app.post("/assistant/mngevent/detail/edit-vendor/:idEvent/:idVendor", async (req, res) => {
  const idEvent = req.params.idEvent;
  const idVendor = req.params.idVendor;
  const { priceStatus, price } = req.body;

  if (priceStatus == "Fix") {
    try {
      const pool = connect();
      const [result] = await pool.execute(
        "UPDATE EventVendor SET harga_dealing = ? WHERE id_event = ? AND id_vendor = ?",
        [price, idEvent, idVendor]
      );

      if (result.affectedRows == 1) {
        req.flash("status", "Vendor Dealing Price Successfully Updated!");
        res.redirect("/assistant/mngevent/detail/" + idEvent);
      }
    } catch (err) {
      req.flash("status", "Vendor Dealing Price Cannot Be Updated!");
      res.redirect("/assistant/mngevent/detail/" + idEvent);
      console.log(err.message);
    }
  } else {
    try {
      const pool = connect();
      const [result] = await pool.execute(
        "UPDATE EventVendor SET harga_dealing = null WHERE id_event = ? AND id_vendor = ?",
        [idEvent, idVendor]
      );

      if (result.affectedRows == 1) {
        req.flash("status", "Vendor Price Successfully Updated to Estimation!");
        res.redirect("/assistant/mngevent/detail/" + idEvent);
      }
    } catch (err) {
      req.flash("status", "Vendor Price Cannot Be Updated to Estimation!");
      res.redirect("/assistant/mngevent/detail/" + idEvent);
      console.log(err.message);
    }
  }
});

// POST dari halaman detail event - delete vendor DONE
app.post("/assistant/mngevent/detail/delete-vendor/:idEvent/:idVendor", async (req, res) => {
  const idEvent = req.params.idEvent;
  const idVendor = req.params.idVendor;

  try {
    const pool = connect();
    const [result] = await pool.execute(
        "DELETE FROM EventVendor WHERE id_event = ? AND id_vendor = ?",
        [idEvent, idVendor]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Successfully Deleted From Event!");
      res.redirect("/assistant/mngevent/detail/" + idEvent);
    }
  } catch (err) {
    req.flash("status", "Vendor Cannot Be Deleted From Event!");
    res.redirect("/assistant/mngevent/detail/" + idEvent);
    console.log(err.message);
  }
});

// --------------------------- OWNER INTERFACE ------------------------------

// Route untuk ke dashboard / home owner DONE
app.get("/owner/dashboard", (req, res) => {
  res.render("dashboardowner.ejs", {
    title: "Dashboard Owner",
    active: 1,
  });
});

// Route untuk ke Manage Assistant DONE
app.get("/owner/mngassistant", async (req, res) => {
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 7;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || ""; 

  try {
    const pool = connect();
    const [rows] = await pool.execute(
        "SELECT * FROM Asisten WHERE is_active = 1 AND nama_asisten LIKE CONCAT('%', ?, '%')",
        [search]
    );

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    res.render("layout-assistant.ejs", {
      title: "Manage Assistant",
      heading: "Assistant List",
      columns: ["Edit", "Name", "Address", "Contact"],
      assistants: paginated,
      active: 2,
      currentPage: page,
      totalPages: totalPages,
      status: status,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Manage Assistant - Add Assistant DONE
app.get("/owner/mngassistant/add-assistant", (req, res) => {
  res.render("layout-add-owner.ejs", {
    title: "Add Assistant",
    heading: "Add Assistant",
    formAction: "/owner/mngassistant/add-assistant",
    fields: [
      { label: "Assistant Name", name: "assistantName", placeholder: "name..." },
      { label: "Assistant Account Password", name: "assistantPassword", placeholder: "account password..." },
      { label: "Assistant Address", name: "assistantAddress", placeholder: "address..." },
      { label: "Assistant Contact", name: "assistantContact", placeholder: "contact..." },
    ],
    active: 2,
    mode: "add",
  });
});

// Route untuk ke Manage Assistant - Edit Assistant DONE
app.get("/owner/mngassistant/edit-assistant/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();
    const [rows] = await pool.execute("SELECT * FROM Asisten WHERE id_asisten = ?", [id]);

    res.render("layout-add-owner.ejs", {
      title: "Edit Assistant",
      heading: "EditAssistant",
      formAction: "/owner/mngassistant/edit-assistant/" + id,
      formDeleteAction: "/owner/mngassistant/edit-assistant/delete/" + id,
      fields: [
        { label: "Assistant Name", name: "assistantName", placeholder: "name...", value: rows[0].nama_asisten },
        { label: "Assistant Account Password", name: "assistantPassword", placeholder: "account password...", value: rows[0].password },
        { label: "Assistant Address", name: "assistantAddress", placeholder: "address...", value: rows[0].alamat_asisten },
        { label: "Assistant Contact", name: "assistantContact", placeholder: "contact...", value: rows[0].kontak_asisten },
      ],
      active: 2,
      mode: "edit",
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Manage Vendor DONE

// WP 3.1.2 START
app.get("/owner/mngvendor", async (req, res) => {
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 7;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || ""; 

  try {
    const pool = connect();

    const sqlQuery = `
      SELECT t2.id_vendor, t2.nama_vendor, t2.nama_pemilik, t2.alamat, t2.kontak, t2.harga_min, t2.harga_max, KategoriVendor.nama_kategori 
      FROM (SELECT * FROM Vendor WHERE is_active = 1 AND nama_vendor LIKE CONCAT('%', ?, '%')) AS t2 
      INNER JOIN KategoriVendor ON KategoriVendor.id_kategori = t2.id_kategori`;

    const [rows] = await pool.execute(sqlQuery, [search]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    res.render("layout-vendor.ejs", {
      title: "Manage Vendor",
      heading: "Vendor List",
      columns: ["Edit", "Name", "Owner", "Address", "Price Range", "Type", "Contact"],
      vendors: paginated,
      active: 3,
      currentPage: page,
      totalPages: totalPages,
      status: status,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Manage Vendor - Add Vendor DONE
app.get("/owner/mngvendor/add-vendor", async (req, res) => {
  try {
    const pool = connect();
    const [rows] = await pool.execute("SELECT * FROM KategoriVendor WHERE is_active = 1");

    res.render("layout-add-owner.ejs", {
      title: "Add Vendor",
      heading: "Add Vendor",
      formAction: "/owner/mngvendor/add-vendor",
      fields: [
        { label: "Vendor Name", name: "vendorName", placeholder: "name...", type: "text" },
        { label: "Vendor Owner", name: "vendorOwner", placeholder: "owner...", type: "text" },
        { label: "Vendor Address", name: "vendorAddress", placeholder: "address...", type: "text" },
        { label: "Min Price", name: "minPrice", placeholder: "min price...", type: "text" },
        { label: "Max Price", name: "maxPrice", placeholder: "max price...", type: "text" },
        {
          label: "Type",
          name: "type",
          type: "select",
          options: rows,
        },
        { label: "Contact", name: "contact", placeholder: "contact...", type: "text" },
      ],
      active: 3,
      mode: "add",
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Manage Vendor - Edit Vendor DONE
app.get("/owner/mngvendor/edit-vendor/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();

    const [rowsKat] = await pool.execute("SELECT * FROM KategoriVendor WHERE is_active = 1");
    const [rowsVendor] = await pool.execute("SELECT * FROM Vendor WHERE id_vendor = ?", [id]);

    res.render("layout-add-owner.ejs", {
      title: "Edit Vendor",
      heading: "Edit Vendor",
      formAction: "/owner/mngvendor/edit-vendor/" + id,
      formDeleteAction: "/owner/mngvendor/edit-vendor/delete/" + id,
      fields: [
        { label: "Vendor Name", name: "vendorName", placeholder: "name...", type: "text", value: rowsVendor[0].nama_vendor },
        { label: "Vendor Owner", name: "vendorOwner", placeholder: "owner...", type: "text", value: rowsVendor[0].nama_pemilik },
        { label: "Vendor Address", name: "vendorAddress", placeholder: "address...", type: "text", value: rowsVendor[0].alamat },
        { label: "Min Price", name: "minPrice", placeholder: "min price...", type: "text", value: rowsVendor[0].harga_min },
        { label: "Max Price", name: "maxPrice", placeholder: "max price...", type: "text", value: rowsVendor[0].harga_max },
        {
          label: "Type",
          name: "type",
          type: "select",
          options: rowsKat,
          value: rowsVendor[0].id_kategori,
        },
        { label: "Contact", name: "contact", placeholder: "contact...", type: "text", value: rowsVendor[0].kontak },
      ],
      active: 3,
      mode: "edit",
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Manage Vendor - Manage Type DONE
app.get("/owner/mngvendor/mngtype", async (req, res) => {
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 6;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || ""; 

  try {
    const pool = connect();

    const [rows] = await pool.execute(
        "SELECT * FROM KategoriVendor WHERE is_active = 1 AND nama_kategori LIKE CONCAT('%', ?, '%')", 
        [search]
    );

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    res.render("manageVendorType.ejs", {
      title: "Edit Vendor",
      vendorTypes: paginated,
      currentPage: page,
      totalPages: totalPages,
      status: status,
      active: 3,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// WP 3.1.2 END

// Route untuk ke Laporan Kerjasama DONE
app.get("/owner/lapkerjasama", async (req, res) => {
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || ""; 

  try {
    const pool = connect();

    const sqlQuery = `
      SELECT v.id_vendor, v.nama_vendor, 
      COUNT(CASE WHEN e.status = 'On Process' THEN 1 END) AS OnProcess, 
      COUNT(CASE WHEN e.status = 'Finished' THEN 1 END) AS Finished, 
      COUNT(CASE WHEN e.status IN ('On Process', 'Finished') THEN 1 END) AS Total 
      FROM Vendor v 
      LEFT JOIN EventVendor ev ON v.id_vendor = ev.id_vendor 
      LEFT JOIN Event e ON ev.id_event = e.id_event 
      WHERE v.nama_vendor LIKE CONCAT('%', ?, '%') AND v.is_active = 1 
      GROUP BY v.id_vendor, v.nama_vendor 
      ORDER BY v.id_vendor;`;

    const [rows] = await pool.execute(sqlQuery, [search]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    res.render("layout-lapks.ejs", {
      title: "Laporan Kerjasama",
      heading: "Laporan Kerjasama",
      columns: ["Vendor", "On Process", "Finished", "Total Kerjasama", ""],
      vendors: paginated,
      active: 4,
      currentPage: page,
      totalPages: totalPages,
      status: status,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Laporan Kerjasama - Detail
app.get("/owner/lapkerjasama/detail/:id", async (req, res) => {
  const idVendor = req.params.id;
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 7;
  const page = parseInt(req.query.page) || 1;

  try {
    const pool = connect();

    const [rowsNama] = await pool.execute("SELECT nama_vendor FROM Vendor WHERE id_vendor = ?", [idVendor]);

    const sqlQuery = `
      SELECT Klien.nama, JenisEvent.nama_jenis, KategoriVendor.nama_kategori, ev.harga_dealing 
      FROM (SELECT * FROM EventVendor WHERE id_vendor = ?) AS ev 
      INNER JOIN Event ON Event.id_event = ev.id_event 
      INNER JOIN Vendor ON Vendor.id_vendor = ev.id_vendor 
      INNER JOIN MenyelenggarakanEvent ON MenyelenggarakanEvent.id_event = Event.id_event 
      INNER JOIN Klien ON Klien.id_klien = MenyelenggarakanEvent.id_klien 
      INNER JOIN JenisEvent ON JenisEvent.id_jenis = Event.id_jenis 
      INNER JOIN KategoriVendor ON Vendor.id_kategori = KategoriVendor.id_kategori`;

    const [rows] = await pool.execute(sqlQuery, [idVendor]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    const [rowsSum] = await pool.execute("SELECT SUM(harga_dealing) AS 'Sum' FROM EventVendor WHERE id_vendor = ?", [idVendor]);

    res.render("detail-lapks.ejs", {
      title: "Detail Kerjasama",
      heading: rowsNama[0].nama_vendor + "'s History",
      columns: ["Event", "Type", "Dealing Price"],
      active: 4,
      vendors: paginated,
      currentPage: page,
      totalPages: totalPages,
      sum: rowsSum[0].Sum,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Laporan Event DONE
app.get("/owner/lapevent", async (req, res) => {
  const statusMessages = req.flash("status");
  const status = statusMessages.length > 0 ? statusMessages[0] : null;
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || ""; 

  try {
    const pool = connect();

    // MENGUBAH: DATE_FORMAT dan CONCAT
    const sqlQuery = `
      SELECT Event.id_event, Klien.nama, JenisEvent.nama_jenis, DATE_FORMAT(Event.tanggal, '%Y-%m-%d') AS tanggal, Event.status, Asisten.nama_asisten 
      FROM MenyelenggarakanEvent 
      INNER JOIN Event ON Event.id_event = MenyelenggarakanEvent.id_event 
      INNER JOIN Asisten ON Asisten.id_asisten = MenyelenggarakanEvent.id_asisten 
      INNER JOIN Klien ON Klien.id_klien = MenyelenggarakanEvent.id_klien 
      INNER JOIN JenisEvent ON Event.id_jenis = JenisEvent.id_jenis 
      WHERE Klien.nama LIKE CONCAT('%', ?, '%') 
      ORDER BY status DESC`;

    const [rows] = await pool.execute(sqlQuery, [search]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    res.render("layout-lapevent.ejs", {
      title: "Laporan Event",
      heading: "Laporan Event",
      columns: ["Client", "Event Type", "Event Date", "Status", "Handled By", ""],
      events: paginated,
      active: 5,
      currentPage: page,
      totalPages: totalPages,
      status: status,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// Route untuk ke Laporan Event - Detail DONE
app.get("/owner/lapevent/detail/:id", async (req, res) => {
  const id = req.params.id;
  const perPage = 7;
  const page = parseInt(req.query.page) || 1;

  try {
    const pool = connect();

    const sqlVendors = `
      SELECT Vendor.id_vendor, Vendor.nama_vendor, KategoriVendor.nama_kategori, EventVendor.harga_dealing, Vendor.harga_min, Vendor.harga_max 
      FROM (SELECT * FROM Event WHERE id_event = ?) AS e 
      INNER JOIN EventVendor ON EventVendor.id_event = e.id_event 
      INNER JOIN Vendor ON EventVendor.id_vendor = Vendor.id_vendor 
      INNER JOIN KategoriVendor ON KategoriVendor.id_kategori = Vendor.id_kategori`;

    const [rows] = await pool.execute(sqlVendors, [id]);

    const totalItems = rows.length;
    const start = (page - 1) * perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginated = rows.slice(start, start + perPage);

    const sqlTotal = "SELECT SUM(EventVendor.harga_dealing) AS 'TotalFix' FROM(SELECT * FROM Event WHERE id_event = ?) AS e INNER JOIN EventVendor ON EventVendor.id_event = e.id_event";
    const [totalFix] = await pool.execute(sqlTotal, [id]);

    const sqlHeading = `
      SELECT Klien.nama, JenisEvent.nama_jenis 
      FROM (SELECT * FROM Event WHERE id_event = ?) AS e 
      INNER JOIN MenyelenggarakanEvent ON e.id_event = MenyelenggarakanEvent.id_event 
      INNER JOIN JenisEvent ON e.id_jenis = JenisEvent.id_jenis 
      INNER JOIN Klien ON MenyelenggarakanEvent.id_klien = Klien.id_klien`;
    const [heading] = await pool.execute(sqlHeading, [id]);

    res.render("detail-event-owner.ejs", {
      title: "Event - Vendor Detail",
      heading: heading[0].nama + "'s " + heading[0].nama_jenis,
      columns: ["Vendor", "Type", "Price", "Status"],
      vendors: paginated,
      active: 5,
      currentPage: page,
      totalPages: totalPages,
      totalFix: totalFix[0].TotalFix || 0,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// --------------------------- OWNER POST HANDLING ----------------------

// POST dari Manage Assistant - Add Assistant DONE
app.post("/owner/mngassistant/add-assistant", async (req, res) => {
  const { assistantName, assistantPassword, assistantAddress, assistantContact } = req.body;

  try {
    const pool = connect();
    const [result] = await pool.execute(
        "INSERT INTO Asisten(nama_asisten, password, alamat_asisten, kontak_asisten) VALUES(?, ?, ?, ?)",
        [assistantName, assistantPassword, assistantAddress, assistantContact]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Assistant Successfully Added!");
      res.redirect("/owner/mngassistant");
    }
  } catch (err) {
    req.flash("status", "Assistant Cannot Be Added!");
    res.redirect("/owner/mngassistant");
    console.log(err.message);
  }
});

// POST dari Manage Assistant - Edit Assistant DONE
app.post("/owner/mngassistant/edit-assistant/:id", async (req, res) => {
  const id = req.params.id;
  const { assistantName, assistantPassword, assistantAddress, assistantContact } = req.body;

  try {
    const pool = connect();
    const [result] = await pool.execute(
        "UPDATE Asisten SET nama_asisten = ?, password = ?, alamat_asisten = ?, kontak_asisten = ? WHERE id_asisten = ?",
        [assistantName, assistantPassword, assistantAddress, assistantContact, id]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Assistant Successfully Updated!");
      res.redirect("/owner/mngassistant");
    }
  } catch (err) {
    req.flash("status", "Assistant Cannot Be Updated!");
    res.redirect("/owner/mngassistant");
    console.log(err.message);
  }
});

// POST dari Manage Assistant - Edit Assistant - Delete DONE
app.post("/owner/mngassistant/edit-assistant/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();
    const [result] = await pool.execute("UPDATE Asisten SET is_active = 0 WHERE id_asisten = ?", [id]);

    if (result.affectedRows == 1) {
      req.flash("status", "Assistant Successfully Deleted!");
      res.redirect("/owner/mngassistant");
    }
  } catch (err) {
    req.flash("status", "Assistant Cannot Be Deleted!");
    res.redirect("/owner/mngassistant");
    console.log(err.message);
  }
});


// WP 3.1.2
// POST dari Manage Vendor - Add Vendor DONE
app.post("/owner/mngvendor/add-vendor", async (req, res) => {
  const { vendorName, vendorOwner, vendorAddress, minPrice, maxPrice, type, contact } = req.body;

  try {
    const pool = connect();
    const [result] = await pool.execute(
        "INSERT INTO Vendor(nama_vendor, nama_pemilik, alamat, kontak, harga_min, harga_max, id_kategori) VALUES(?, ?, ?, ?, ?, ?, ?)",
        [vendorName, vendorOwner, vendorAddress, contact, minPrice, maxPrice, type]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Successfully Added!");
      res.redirect("/owner/mngvendor");
    }
  } catch (err) {
    req.flash("status", "Vendor Cannot Be Added!");
    res.redirect("/owner/mngvendor");
    console.log(err.message);
  }
});

// POST dari Manage Vendor - Edit Vendor DONE
app.post("/owner/mngvendor/edit-vendor/:id", async (req, res) => {
  const id = req.params.id;
  const { vendorName, vendorOwner, vendorAddress, minPrice, maxPrice, type, contact } = req.body;

  try {
    const pool = connect();
    const [result] = await pool.execute(
        "UPDATE Vendor SET nama_vendor = ?, nama_pemilik = ?, alamat = ?, kontak = ?, harga_min = ?, harga_max = ?, id_kategori = ? WHERE id_vendor = ?",
        [vendorName, vendorOwner, vendorAddress, contact, minPrice, maxPrice, type, id]
    );

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Successfully Updated!");
      res.redirect("/owner/mngvendor");
    }
  } catch (err) {
    req.flash("status", "Vendor Cannot Be Updated!");
    res.redirect("/owner/mngvendor");
    console.log(err.message);
  }
});

// POST dari Manage Vendor - Edit Vendor - Delete DONE
app.post("/owner/mngvendor/edit-vendor/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();
    const [result] = await pool.execute("UPDATE Vendor SET is_active = 0 WHERE id_vendor = ?", [id]);

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Successfully Deleted!");
      res.redirect("/owner/mngvendor");
    }
  } catch (err) {
    req.flash("status", "Vendor Cannot Be Deleted!");
    res.redirect("/owner/mngvendor");
    console.log(err.message);
  }
});

// POST dari Manage Vendor - Manage Vendor Type - Add Type DONE
app.post("/owner/mngvendor/mngtype/add-type", async (req, res) => {
  const { typeName } = req.body;

  try {
    const pool = connect();
    const [result] = await pool.execute("INSERT INTO KategoriVendor(nama_kategori) VALUES(?)", [typeName]);

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Type Successfully Added!");
      res.redirect("/owner/mngvendor/mngtype");
    }
  } catch (err) {
    req.flash("status", "Vendor Type Cannot Be Added!");
    res.redirect("/owner/mngvendor/mngtype");
    console.log(err.message);
  }
});

// POST dari Manage Vendor - Manage Vendor Type - Delete Type DONE
app.post("/owner/mngvendor/mngtype/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = connect();
    const [result] = await pool.execute("UPDATE KategoriVendor SET is_active = 0 WHERE id_kategori = ?", [id]);

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Type Successfully Deleted!");
      res.redirect("/owner/mngvendor/mngtype");
    }
  } catch (err) {
    req.flash("status", "Vendor Type Cannot Be Deleted!");
    res.redirect("/owner/mngvendor/mngtype");
    console.log(err.message);
  }
});

// POST dari Manage Vendor - Manage Vendor Type - Update Type DONE
app.post("/owner/mngvendor/mngtype/update/:id", async (req, res) => {
  const id = req.params.id;
  const newType = req.body.newType;

  try {
    const pool = connect();
    const [result] = await pool.execute("UPDATE KategoriVendor SET nama_kategori = ? WHERE id_kategori = ?", [newType, id]);

    if (result.affectedRows == 1) {
      req.flash("status", "Vendor Type Successfully Updated!");
      res.redirect("/owner/mngvendor/mngtype");
    }
  } catch (err) {
    req.flash("status", "Vendor Type Cannot Be Updated!");
    res.redirect("/owner/mngvendor/mngtype");
    console.log(err.message);
  }
});
// WP 3.1.2 END

// WP 2.4.1
// Inisialisasi Database
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
});