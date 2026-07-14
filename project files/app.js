/**
 * ServiceNow - Smart Library Request Manager Simulation
 * Core Application Engine
 */

// ==========================================
// 1. EMBEDDED MARKDOWN TEXTS FOR LOCAL COMPATIBILITY
// ==========================================
const technicalBlueprintMD = `# Technical Blueprint: Smart Library Request Workflow

This blueprint defines the database tables, fields, access controls, flows, UI policies, and reports for implementing the Smart Library Request Workflow in ServiceNow.

---

## 1. Database Schema

### 1.1 Book Table (\`u_book\`)
Tracks the library's physical catalog and current book availability.

| Field Label | Database Column | Data Type | Choice/Reference Details | Default Value | Mandatory |
|---|---|---|---|---|---|
| Title | \`u_title\` | String (100) | - | - | Yes |
| Author | \`u_author\` | String (100) | - | - | Yes |
| ISBN | \`u_isbn\` | String (20) | - | - | No |
| Status | \`u_status\` | Choice | - **Available** (\`available\`) <br>- **Issued** (\`issued\`) <br>- **Lost** (\`lost\`) | \`available\` | Yes |

### 1.2 Borrow Request Table (\`u_borrow_request\`)
Manages book request transactions, approvals, and status tracking.

| Field Label | Database Column | Data Type | Choice/Reference Details | Default Value | Mandatory |
|---|---|---|---|---|---|
| Requested By | \`u_requested_by\` | Reference | Points to User Table (\`sys_user\`) | Dynamic: Current User | Yes |
| Book | \`u_book\` | Reference | Points to Book Table (\`u_book\`) | - | Yes |
| Request Date | \`u_request_date\` | Date | - | Dynamic: Current Date | Yes |
| Return Date | \`u_return_date\` | Date | - | - | Conditional (Mandatory when status is Issued) |
| Status | \`u_status\` | Choice | - **Requested** (\`requested\`) <br>- **Approved** (\`approved\`) <br>- **Rejected** (\`rejected\`) <br>- **Returned** (\`returned\`) | \`requested\` | Yes |

---

## 2. Table Relationships
- **Borrow Request -> Book** (\`u_borrow_request.u_book\`): Many-to-One reference to \`u_book\`.
- **Related List on Book Form**: Displays all Borrow Requests referencing the specific book (\`u_borrow_request.u_book\`).

---

## 3. Data Integrity & Validation Rules

### 3.1 Reference Qualifier (Book Field)
Prevents students from selecting books that are already checked out or lost.
- **Applied to**: \`u_borrow_request.u_book\` field.
- **Reference Qualifier Type**: Simple
- **Condition Filter**: \`u_status=available\`

### 3.2 UI Policy (Form Restrictions)
Locks down fields to prevent accidental edits once the borrowing has been approved or the book has been issued.
- **UI Policy Name**: Make Return Date mandatory when Issued
- **Table**: \`u_borrow_request\`
- **Conditions**: \`Status\` is \`Approved\` OR \`Status\` is \`Issued\`
- **UI Policy Actions**:
  - \`u_return_date\` -> Mandatory: **True**, Visible: **True**
  - \`u_book\` -> Read-only: **True**
  - \`u_requested_by\` -> Read-only: **True**
  - \`u_request_date\` -> Read-only: **True**

---

## 4. Access Control Rules (ACL Matrix)

Role-based access controls (ACLs) restrict operations on tables to maintain system security.
- **Student Role (\`student\`)**: Has permissions to browse the catalog and submit/track their own requests.
- **Librarian Role (\`librarian\`)**: Has complete access to manage the catalog, review requests, and execute returns.

| Table | Operation | Requires Role | Description / Advanced Condition |
|---|---|---|---|
| \`u_book\` | \`read\` | \`student\`, \`librarian\` | Anyone can browse the catalog. |
| \`u_book\` | \`create\` | \`librarian\` | Only librarians can add books. |
| \`u_book\` | \`write\` | \`librarian\` | Only librarians can modify book details. |
| \`u_book\` | \`delete\` | \`librarian\` | Only librarians can delete catalog items. |
| \`u_borrow_request\` | \`create\` | \`student\` | Only students can initiate request tickets. |
| \`u_borrow_request\` | \`read\` | \`student\`, \`librarian\` | Librarians can read all. Students can only read their own requests (Condition: \`u_requested_by=javascript:gs.getUserID()\`). |
| \`u_borrow_request\` | \`write\` | \`librarian\` | Only librarians can update/approve requests. |
| \`u_borrow_request\` | \`delete\` | \`librarian\` | Only librarians can delete requests. |

---

## 5. Flow Designer Workflow (Borrow Request Approval Flow)

Automates the transaction flow from request submission to approval, issuance, and notification.

- **Trigger**:
   - Table: Borrow Request (\`u_borrow_request\`)
   - Condition: \`Status\` changes to \`Requested\`
- **Approval Step**:
   - Action: \`Ask For Approval\`
   - Approver: Users with \`librarian\` role (or Group: \`Librarians\`)
- **If Approved Branch**:
   - **Action 1 (Update Book)**: Book Status = \`Issued\`
   - **Action 2 (Update Request)**: Request Status = \`Approved\`
   - **Action 3 (Send Email)**: Notify Requester.
- **If Rejected Branch**:
   - **Action 1 (Update Request)**: Request Status = \`Rejected\`
   - **Action 2 (Send Email)**: Notify Requester.

---

## 6. Report Specifications

### "Most Borrowed Books" Report
Identifies catalog usage trends.
- **Source Type**: Table
- **Table**: Borrow Request (\`u_borrow_request\`)
- **Type**: Vertical Bar Chart
- **Group By**: \`Book\`
- **Aggregate**: Count
- **Filter**: \`Status\` is \`Approved\` OR \`Status\` is \`Returned\`
`;

const setupManualMD = `# Setup Manual: ServiceNow Smart Library Request Workflow

This step-by-step manual outlines how to recreate the Smart Library Request Workflow in a ServiceNow Personal Developer Instance (PDI).

---

## Phase 1: Create Roles
1. Log in to your ServiceNow instance.
2. In the Application Navigator, search for **User Administration** and select **Roles**.
3. Click the **New** button at the top of the list.
4. Fill in the following details:
   - **User role**: \`librarian\`
   - **Description**: Library Administrator with permissions to manage books, approvals, and system settings.
5. Click **Submit**.
6. Click the **New** button again.
7. Fill in the details for the second role:
   - **User role**: \`student\`
   - **Description**: Library Client with permissions to view available books and request loans.
8. Click **Submit**.

---

## Phase 2: Create Tables & Add Fields

### Step 1: Create Book Table (\`u_book\`)
1. Search for **System Definition** in the navigator and click **Tables**.
2. Click **New**.
3. Configure the table:
   - **Label**: \`Book\`
   - **Name**: \`u_book\`
   - **Create module**: Checked
4. Click **Submit**.
5. Add fields in the **Columns** related list:
   - **Title** (\`u_title\`): Type = \`String\`, Max Length = \`100\`, Mandatory = \`True\`.
   - **Author** (\`u_author\`): Type = \`String\`, Max Length = \`100\`, Mandatory = \`True\`.
   - **ISBN** (\`u_isbn\`): Type = \`String\`, Max Length = \`20\`.
   - **Status** (\`u_status\`): Type = \`Choice\`, Default value = \`available\`.
     - *Choices*: \`available\` (Available), \`issued\` (Issued), \`lost\` (Lost).
6. Click **Update**.

### Step 2: Create Borrow Request Table (\`u_borrow_request\`)
1. Return to **System Definition -> Tables** and click **New**.
2. Configure the table:
   - **Label**: \`Borrow Request\`
   - **Name**: \`u_borrow_request\`
3. Click **Submit**.
4. Add fields in the **Columns** related list:
   - **Requested By** (\`u_requested_by\`): Type = \`Reference\`, Table = \`sys_user\`, Default Value = \`javascript:gs.getUserID()\`.
   - **Book** (\`u_book\`): Type = \`Reference\`, Table = \`Book\` (\`u_book\`), Mandatory = \`True\`.
   - **Request Date** (\`u_request_date\`): Type = \`Date\`, Default Value = \`javascript:new GlideDate()\`.
   - **Return Date** (\`u_return_date\`): Type = \`Date\`.
   - **Status** (\`u_status\`): Type = \`Choice\`, Default value = \`requested\`.
     - *Choices*: \`requested\` (Requested), \`approved\` (Approved), \`rejected\` (Rejected), \`returned\` (Returned).
5. Click **Update**.

---

## Phase 3: Related List on Book Form
1. Open the form of any Book record.
2. Right-click the form header -> **Configure -> Related Lists**.
3. Move **Borrow Request -> Book** to the Selected list.
4. Click **Save**.

---

## Phase 4: Reference Qualifier
1. Open table \`Borrow Request\` (\`u_borrow_request\`).
2. Open the **Book** field record in the dictionary columns list.
3. Scroll to the **Reference Qualifier** section and set:
   - **Use reference qualifier**: \`Simple\`
   - **Reference Qualifier Condition**: \`Status\` [is] \`Available\` (\`u_status=available\`)
4. Click **Update**.

---

## Phase 5: Flow Designer Setup
1. Open **Flow Designer**. Click **New** -> **Flow**.
2. Name: \`Borrow Request Approval Flow\`. Click **Submit**.
3. **Trigger**:
   - **Table**: \`Borrow Request [u_borrow_request]\`
   - **Condition**: \`Status\` [is] \`Requested\`
4. **Action 1: Ask for Approval**:
   - **Record**: \`Trigger -> Borrow Request Record\`
   - **Approvers**: Role: \`librarian\`.
5. **Flow Logic: If Approved**:
   - **Action A (Update Book)**: Status = \`Issued\`
   - **Action B (Update Request)**: Status = \`Approved\`
   - **Action C (Send Email)**: Subject: \`Request Approved\`, To: \`Requested By\`.
6. **Flow Logic: If Rejected**:
   - **Action A (Update Request)**: Status = \`Rejected\`
   - **Action B (Send Email)**: Subject: \`Request Rejected\`, To: \`Requested By\`.
7. Click **Save** and **Activate**.

---

## Phase 6: UI Policy
1. Navigate to **System UI -> UI Policies** and click **New**.
2. Configure:
   - **Table**: \`Borrow Request [u_borrow_request]\`
   - **Short Description**: \`Make Return Date mandatory when Issued\`
   - **Conditions**: \`Status\` [is] \`Approved\` OR \`Status\` [is] \`Issued\`
3. Click **Save** from the header dropdown.
4. In the **UI Policy Actions** related list, click **New**:
   - **Field name**: \`Return Date\`, **Mandatory**: \`True\`, **Visible**: \`True\`.
   - *Repeat for fields to set them Read-only: Book, Requested By, Request Date.*

---

## Phase 7: Access Control Lists (ACLs)
- **Book Table Read**: Roles: \`student\`, \`librarian\`.
- **Book Table Create/Write/Delete**: Roles: \`librarian\`.
- **Request Table Create**: Roles: \`student\`.
- **Request Table Read**: Condition: \`Requested By == Current User\` OR \`Has Role Librarian\`.
- **Request Table Write/Delete**: Roles: \`librarian\`.

---

## Phase 8: Create Report
1. Open **Reports -> View / Run** -> Click **New**.
2. Report Name: \`Most Borrowed Books\`, Table: \`Borrow Request [u_borrow_request]\`.
3. Type: **Bar Chart**, Group by: \`Book\`, Aggregation: \`Count\`.
4. Filter: \`Status\` [is one of] \`Approved, Returned\`. Click **Save**.
`;

// ==========================================
// 2. INITIAL DATABASE & STATE DEFINITION
// ==========================================

const DEFAULT_BOOKS = [
  { id: "b_1", title: "The Phoenix Project", author: "Gene Kim", isbn: "978-0988262591", status: "available" },
  { id: "b_2", title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884", status: "issued" },
  { id: "b_3", title: "ServiceNow ITIL Practitioner Guide", author: "Axelos", isbn: "978-0113314874", status: "available" },
  { id: "b_4", title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "978-0262033848", status: "available" },
  { id: "b_5", title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", isbn: "978-1449373320", status: "lost" }
];

const DEFAULT_REQUESTS = [
  { id: "REQ-1001", bookId: "b_2", bookTitle: "Clean Code", requestedById: "sys_user_aravind", requestedByName: "Aravind Kumar (Student)", requestDate: "2026-07-10", returnDate: "", status: "approved" },
  { id: "REQ-1002", bookId: "b_4", bookTitle: "Introduction to Algorithms", requestedById: "sys_user_aravind", requestedByName: "Aravind Kumar (Student)", requestDate: "2026-07-12", returnDate: "2026-07-14", status: "returned" },
  { id: "REQ-1003", bookId: "b_5", bookTitle: "Designing Data-Intensive Applications", requestedById: "sys_user_sarah", requestedByName: "Sarah Jenkins (Librarian)", requestDate: "2026-07-08", returnDate: "", status: "rejected" }
];

const USER_ROLES = {
  student: { name: "Aravind Kumar", role: "student", id: "sys_user_aravind", avatar: "AK" },
  librarian: { name: "Sarah Jenkins", role: "librarian", id: "sys_user_sarah", avatar: "SJ" },
  admin: { name: "System Administrator", role: "admin", id: "sys_user_admin", avatar: "SA" }
};

let books = [];
let borrowRequests = [];
let currentUser = USER_ROLES.student;
let flowExecutionTimeout = null;

// ==========================================
// 3. DATABASE HELPER FUNCTIONS
// ==========================================

function initDatabase() {
  const storedBooks = localStorage.getItem("sn_books");
  const storedRequests = localStorage.getItem("sn_requests");
  
  if (storedBooks && storedRequests) {
    books = JSON.parse(storedBooks);
    borrowRequests = JSON.parse(storedRequests);
  } else {
    resetDatabaseToDefault();
  }
}

function saveDatabase() {
  localStorage.setItem("sn_books", JSON.stringify(books));
  localStorage.setItem("sn_requests", JSON.stringify(borrowRequests));
}

function resetDatabaseToDefault() {
  books = JSON.parse(JSON.stringify(DEFAULT_BOOKS));
  borrowRequests = JSON.parse(JSON.stringify(DEFAULT_REQUESTS));
  saveDatabase();
  showToast("Database Reset", "The library database has been restored to default sample data.", "info");
  renderAll();
}

// ==========================================
// 4. GENERAL UI HELPERS
// ==========================================

function showToast(title, body, type = "success") {
  const toast = document.getElementById("toastNotification");
  const tTitle = document.getElementById("toastTitle");
  const tBody = document.getElementById("toastBody");

  tTitle.textContent = title;
  tBody.textContent = body;
  
  toast.className = "toast";
  if (type !== "success") {
    toast.classList.add(type);
  }
  
  toast.classList.remove("hidden");
  
  // Auto-dismiss after 5s
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 5000);
}

// Simple Markdown Parser (renders headers, list, bold, tables, blockquotes)
function renderMarkdown(mdText) {
  let html = mdText
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^\s*>\s*\[!NOTE\]\s*\n([\s\S]*?)(?=\n\n|\n[a-zA-Z]|$)/gim, '<blockquote><strong>Note:</strong><br>$1</blockquote>')
    .replace(/^\s*>\s*\[!IMPORTANT\]\s*\n([\s\S]*?)(?=\n\n|\n[a-zA-Z]|$)/gim, '<blockquote style="border-left-color: var(--warning)"><strong>Important:</strong><br>$1</blockquote>')
    .replace(/^\s*>\s*(.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Wrap list items in <ul>
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  
  // Basic line breaks
  html = html.replace(/\n\n/g, '<br><br>');

  // Handle tables
  const lines = html.split('<br>');
  let inTable = false;
  let tableHtml = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml += '<table>';
      }
      
      const cells = line.split('|').slice(1, -1);
      const isHeader = line.includes('---') || i === 0 || (i > 0 && lines[i-1].includes('Title') && line.includes('Status'));
      
      if (line.includes('---')) {
        // Skip separator line
        continue;
      }
      
      tableHtml += '<tr>';
      cells.forEach(cell => {
        const tag = isHeader ? 'th' : 'td';
        tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
      });
      tableHtml += '</tr>';
    } else {
      if (inTable) {
        inTable = false;
        tableHtml += '</table>';
        lines[i - 1] = tableHtml;
        tableHtml = '';
      }
    }
  }
  
  return lines.join('<br>').replace(/<br><br>/g, '<p></p>');
}

// ==========================================
// 5. SECURITY / ACL CHECK SIMULATION
// ==========================================

function checkACL(table, operation) {
  const enabled = document.getElementById("devACLs").checked;
  if (!enabled) return true; // ACLs turned off in control center

  const role = currentUser.role;

  if (table === "u_book") {
    if (operation === "read") {
      return role === "student" || role === "librarian" || role === "admin";
    }
    // Create, write, delete on catalog items
    return role === "librarian" || role === "admin";
  }

  if (table === "u_borrow_request") {
    if (operation === "create") {
      return role === "student" || role === "admin";
    }
    if (operation === "read") {
      return role === "student" || role === "librarian" || role === "admin";
    }
    // Write and delete request records
    return role === "librarian" || role === "admin";
  }

  return true;
}

// ==========================================
// 6. PROCESS AUTOMATION - FLOW DESIGNER ENGINE
// ==========================================

function appendConsoleLog(message, type = "info") {
  const consoleLogs = document.getElementById("consoleLogs");
  const placeholder = consoleLogs.querySelector(".console-placeholder");
  if (placeholder) {
    consoleLogs.innerHTML = "";
  }
  
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  
  const line = document.createElement("div");
  line.className = `log-line log-${type}`;
  line.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
  
  consoleLogs.appendChild(line);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function runFlowApprovalSimulation(request, approveCallback, rejectCallback) {
  const flowActive = document.getElementById("devFlowDesigner").checked;
  
  // Set active class on page navigator to highlight Flow Designer simulation
  const flowNavItem = document.getElementById("navFlowDesigner");
  
  // Go to Flow Designer tab to watch execution
  switchPage("flowDesigner");
  
  // Reset nodes classes
  const nodes = ["node-trigger", "node-approval", "node-update-book", "node-update-request", "node-send-email-approved", "node-update-request-rejected", "node-send-email-rejected"];
  nodes.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.className = "flow-node " + (id.includes("trigger") ? "trigger-node" : "action-node");
  });
  
  const pb = document.getElementById("flowProgressBar");
  pb.style.width = "0%";
  
  appendConsoleLog(`[Trigger Initiated] Flow triggered for u_borrow_request: ${request.id}`, "info");
  document.getElementById("node-trigger").classList.add("active-step");
  pb.style.width = "15%";
  
  if (!flowActive) {
    setTimeout(() => {
      appendConsoleLog(`Flow Designer is bypassed because 'Enable Flow Designer' is turned OFF in Control Center. Processing immediately...`, "warning");
      document.getElementById("node-trigger").classList.add("completed-step");
      pb.style.width = "100%";
      approveCallback();
    }, 1000);
    return;
  }

  // Step 2: Trigger Condition Passed -> Move to Approval Step
  setTimeout(() => {
    document.getElementById("node-trigger").classList.remove("active-step");
    document.getElementById("node-trigger").classList.add("completed-step");
    document.getElementById("node-approval").classList.add("active-step");
    
    appendConsoleLog(`[Action 1] Ask For Approval initialized. Approver Group: Librarians. Pending action...`, "info");
    pb.style.width = "40%";
    
    // Simulate approval delay / interactive prompt
    setTimeout(() => {
      const confirmApprove = confirm(`ServiceNow Flow Designer Simulation:\n\nBorrow Request ID: ${request.id}\nBook Requested: "${request.bookTitle}"\nRequested By: ${request.requestedByName}\n\nDo you want to APPROVE this borrow request? (Click Cancel to Reject)`);
      
      document.getElementById("node-approval").classList.remove("active-step");
      document.getElementById("node-approval").classList.add("completed-step");
      
      if (confirmApprove) {
        appendConsoleLog(`[Approval Outcome] Librarian approved request ${request.id}.`, "success");
        executeApprovedBranch(request, approveCallback, pb);
      } else {
        appendConsoleLog(`[Approval Outcome] Librarian rejected request ${request.id}.`, "danger");
        executeRejectedBranch(request, rejectCallback, pb);
      }
    }, 1000);
    
  }, 1500);
}

function executeApprovedBranch(request, approveCallback, pb) {
  // Step 3: Update Book Table u_status = issued
  setTimeout(() => {
    document.getElementById("node-update-book").classList.add("active-step");
    appendConsoleLog(`[Action 2] Updating u_book [ID: ${request.bookId}] field Status = 'issued'`, "info");
    pb.style.width = "65%";
    
    // Step 4: Update Borrow Request u_status = approved
    setTimeout(() => {
      document.getElementById("node-update-book").classList.remove("active-step");
      document.getElementById("node-update-book").classList.add("completed-step");
      
      document.getElementById("node-update-request").classList.add("active-step");
      appendConsoleLog(`[Action 3] Updating u_borrow_request [ID: ${request.id}] field Status = 'approved'`, "info");
      pb.style.width = "85%";
      
      // Step 5: Send Email notification to requester
      setTimeout(() => {
        document.getElementById("node-update-request").classList.remove("active-step");
        document.getElementById("node-update-request").classList.add("completed-step");
        
        document.getElementById("node-send-email-approved").classList.add("active-step");
        appendConsoleLog(`[Action 4] Email sent to: "${request.requestedByName}". Subject: "Your Borrow Request has been Approved"`, "success");
        pb.style.width = "100%";
        
        // Skip rejected branches visually
        document.getElementById("node-update-request-rejected").classList.add("skipped-step");
        document.getElementById("node-send-email-rejected").classList.add("skipped-step");
        
        setTimeout(() => {
          document.getElementById("node-send-email-approved").classList.remove("active-step");
          document.getElementById("node-send-email-approved").classList.add("completed-step");
          
          appendConsoleLog(`[Flow Status] Execution finished. Context ID: ctx_${Math.floor(Math.random()*100000)}.`, "success");
          approveCallback();
        }, 1000);
        
      }, 1500);
    }, 1500);
  }, 1500);
}

function executeRejectedBranch(request, rejectCallback, pb) {
  // Skip approved branches visually
  document.getElementById("node-update-book").classList.add("skipped-step");
  document.getElementById("node-update-request").classList.add("skipped-step");
  document.getElementById("node-send-email-approved").classList.add("skipped-step");

  // Step 3: Update Request Table u_status = rejected
  setTimeout(() => {
    document.getElementById("node-update-request-rejected").classList.add("active-step");
    appendConsoleLog(`[Action 2] Updating u_borrow_request [ID: ${request.id}] field Status = 'rejected'`, "info");
    pb.style.width = "70%";
    
    // Step 4: Send Email notification to requester
    setTimeout(() => {
      document.getElementById("node-update-request-rejected").classList.remove("active-step");
      document.getElementById("node-update-request-rejected").classList.add("completed-step");
      
      document.getElementById("node-send-email-rejected").classList.add("active-step");
      appendConsoleLog(`[Action 3] Email sent to: "${request.requestedByName}". Subject: "Your Borrow Request has been Rejected"`, "warning");
      pb.style.width = "100%";
      
      setTimeout(() => {
        document.getElementById("node-send-email-rejected").classList.remove("active-step");
        document.getElementById("node-send-email-rejected").classList.add("completed-step");
        
        appendConsoleLog(`[Flow Status] Execution finished with Rejection. Context ID: ctx_${Math.floor(Math.random()*100000)}.`, "warning");
        rejectCallback();
      }, 1000);
    }, 1500);
  }, 1500);
}

// ==========================================
// 7. CHART & REPORTING RENDER
// ==========================================

function renderReports() {
  const chartContainer = document.getElementById("barChartContainer");
  const statTotalBooks = document.getElementById("statTotalBooks");
  const statAvailableBooks = document.getElementById("statAvailableBooks");
  const statIssuedBooks = document.getElementById("statIssuedBooks");
  const statTotalRequests = document.getElementById("statTotalRequests");

  // Calculate statistics
  const totalBooksCount = books.length;
  const availableBooksCount = books.filter(b => b.status === "available").length;
  const issuedBooksCount = books.filter(b => b.status === "issued").length;
  const totalRequestsCount = borrowRequests.length;

  statTotalBooks.textContent = totalBooksCount;
  statAvailableBooks.textContent = availableBooksCount;
  statIssuedBooks.textContent = issuedBooksCount;
  statTotalRequests.textContent = totalRequestsCount;

  // Process Borrow Request popularities
  // Filter for approved/issued or returned requests to represent actual borrow events
  const successfulRequests = borrowRequests.filter(r => r.status === "approved" || r.status === "returned");
  
  const bookBorrowCounts = {};
  successfulRequests.forEach(req => {
    // Group by book title
    bookBorrowCounts[req.bookTitle] = (bookBorrowCounts[req.bookTitle] || 0) + 1;
  });

  // Sort and pick top 5
  const sortedBooks = Object.keys(bookBorrowCounts)
    .map(title => ({ title, count: bookBorrowCounts[title] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (sortedBooks.length === 0) {
    chartContainer.innerHTML = `
      <div class="chart-empty-state">
        <p>No borrow data available. Add books and approve requests to generate analytical graphs.</p>
      </div>
    `;
    return;
  }

  // Find max count to scale the bars (minimum max of 5 to scale nicely)
  const maxCount = Math.max(5, ...sortedBooks.map(item => item.count));
  
  // Render Y Axis Labels dynamically
  const yLabels = document.querySelector(".y-axis-labels");
  yLabels.innerHTML = "";
  for (let i = maxCount; i >= 0; i--) {
    const label = document.createElement("span");
    label.textContent = i;
    yLabels.appendChild(label);
  }

  // Draw chart columns
  chartContainer.innerHTML = "";
  sortedBooks.forEach(item => {
    const heightPercent = (item.count / maxCount) * 100;
    
    const column = document.createElement("div");
    column.className = "chart-column";
    
    column.innerHTML = `
      <span class="bar-val">${item.count}</span>
      <div class="bar-body" style="height: ${heightPercent}%; min-height: 8px;"></div>
      <span class="bar-label" title="${item.title}">${item.title}</span>
    `;
    
    chartContainer.appendChild(column);
  });
}

// ==========================================
// 8. TABLE RENDER COMPONENT
// ==========================================

function renderCatalogTable() {
  const tableBody = document.getElementById("catalogTableBody");
  const searchQuery = document.getElementById("catalogSearch").value.toLowerCase();
  const filterStatus = document.getElementById("catalogStatusFilter").value;

  tableBody.innerHTML = "";

  // Check Read ACL
  if (!checkACL("u_book", "read")) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--danger-light); padding: 24px;">
          <strong>SECURITY ACCESS VIOLATION:</strong> role '${currentUser.role}' does not possess read privileges for table 'u_book'.
        </td>
      </tr>
    `;
    return;
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery) ||
                          book.author.toLowerCase().includes(searchQuery) ||
                          book.isbn.toLowerCase().includes(searchQuery);
    const matchesFilter = filterStatus === "all" || book.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (filteredBooks.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No books match the filters.</td></tr>`;
    return;
  }

  filteredBooks.forEach(book => {
    const tr = document.createElement("tr");
    
    // Actions block based on roles
    let actionButtons = "";
    if (checkACL("u_book", "write") && book.status === "available" && currentUser.role !== "student") {
      actionButtons += `<button class="btn btn-secondary btn-sm" onclick="markBookStatus('${book.id}', 'lost')">Mark Lost</button>`;
    }
    if (checkACL("u_book", "delete")) {
      actionButtons += `<button class="btn btn-danger btn-sm" onclick="deleteBookRecord('${book.id}')">Delete</button>`;
    }
    if (currentUser.role === "student" && book.status === "available") {
      actionButtons += `<button class="btn btn-primary btn-sm" onclick="openBorrowRequestModalForBook('${book.id}')">Request</button>`;
    }

    if (!actionButtons) {
      actionButtons = `<span style="color: var(--text-muted);">None</span>`;
    }

    tr.innerHTML = `
      <td><strong>${book.title}</strong></td>
      <td>${book.author}</td>
      <td><code>${book.isbn || 'N/A'}</code></td>
      <td><span class="badge-status ${book.status}">${book.status}</span></td>
      <td class="actions-cell">${actionButtons}</td>
    `;
    
    tableBody.appendChild(tr);
  });
}

function renderMyRequestsTable() {
  const tableBody = document.getElementById("myRequestsTableBody");
  tableBody.innerHTML = "";

  if (!checkACL("u_borrow_request", "read")) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--danger-light); padding: 24px;">
          <strong>SECURITY ACCESS VIOLATION:</strong> role '${currentUser.role}' does not possess read privileges for table 'u_borrow_request'.
        </td>
      </tr>
    `;
    return;
  }

  // ACL: Students can only view their OWN requests
  const isLibrarianOrAdmin = currentUser.role === "librarian" || currentUser.role === "admin";
  const userRequests = borrowRequests.filter(req => {
    if (isLibrarianOrAdmin) return true; // view all
    return req.requestedById === currentUser.id; // student filter
  });

  if (userRequests.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">You have no active borrow requests.</td></tr>`;
    return;
  }

  userRequests.forEach(req => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${req.id}</code></td>
      <td><strong>${req.bookTitle}</strong></td>
      <td>${req.requestedByName}</td>
      <td>${req.requestDate}</td>
      <td>${req.returnDate || '<span style="color: var(--text-muted); font-style: italic;">Not returned</span>'}</td>
      <td><span class="badge-status ${req.status}">${req.status}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderAllRequestsTable() {
  const tableBody = document.getElementById("allRequestsTableBody");
  tableBody.innerHTML = "";

  if (!checkACL("u_borrow_request", "read")) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--danger-light); padding: 24px;">
          <strong>SECURITY ACCESS VIOLATION:</strong> role '${currentUser.role}' does not possess read privileges for table 'u_borrow_request'.
        </td>
      </tr>
    `;
    return;
  }

  const pendingBadge = document.getElementById("pendingRequestBadge");
  const pendingRequests = borrowRequests.filter(r => r.status === "requested");
  pendingBadge.textContent = pendingRequests.length;

  if (borrowRequests.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No records found in u_borrow_request.</td></tr>`;
    return;
  }

  borrowRequests.forEach(req => {
    const tr = document.createElement("tr");
    
    // Actions based on request status and roles
    let actionButtons = "";
    const isLibrarianOrAdmin = currentUser.role === "librarian" || currentUser.role === "admin";

    if (isLibrarianOrAdmin) {
      if (req.status === "requested") {
        actionButtons += `
          <button class="btn btn-primary btn-sm" onclick="triggerApprovalFlow('${req.id}', true)">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="triggerApprovalFlow('${req.id}', false)">Reject</button>
        `;
      } else if (req.status === "approved") {
        actionButtons += `<button class="btn btn-secondary btn-sm" onclick="completeBookReturn('${req.id}')">Process Return</button>`;
      }
      if (checkACL("u_borrow_request", "delete")) {
        actionButtons += `<button class="btn btn-danger btn-sm" onclick="deleteRequestRecord('${req.id}')">Delete</button>`;
      }
    }

    if (!actionButtons) {
      actionButtons = `<span style="color: var(--text-muted);">None</span>`;
    }

    tr.innerHTML = `
      <td><code>${req.id}</code></td>
      <td><strong>${req.bookTitle}</strong></td>
      <td>${req.requestedByName}</td>
      <td>${req.requestDate}</td>
      <td>${req.returnDate || '<span style="color: var(--text-muted); font-style: italic;">Not returned</span>'}</td>
      <td><span class="badge-status ${req.status}">${req.status}</span></td>
      <td class="actions-cell">${actionButtons}</td>
    `;
    
    tableBody.appendChild(tr);
  });
}

function renderInventoryTable() {
  const tableBody = document.getElementById("inventoryTableBody");
  tableBody.innerHTML = "";

  if (books.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No books in library catalog.</td></tr>`;
    return;
  }

  books.forEach(book => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${book.title}</strong></td>
      <td>${book.author}</td>
      <td><code>${book.isbn || 'N/A'}</code></td>
      <td><span class="badge-status ${book.status}">${book.status}</span></td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm" onclick="markBookStatus('${book.id}', 'available')">Available</button>
        <button class="btn btn-secondary btn-sm" onclick="markBookStatus('${book.id}', 'lost')">Lost</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBookRecord('${book.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ==========================================
// 9. EVENT ACTIONS
// ==========================================

function deleteBookRecord(id) {
  if (!checkACL("u_book", "delete")) {
    showToast("ACL Security Denied", "Only librarians are permitted to delete Book records.", "error");
    return;
  }

  books = books.filter(b => b.id !== id);
  saveDatabase();
  showToast("Record Deleted", "Book record successfully deleted from the catalog.", "success");
  renderAll();
}

function deleteRequestRecord(id) {
  if (!checkACL("u_borrow_request", "delete")) {
    showToast("ACL Security Denied", "Only librarians are permitted to delete Borrow Request records.", "error");
    return;
  }

  borrowRequests = borrowRequests.filter(r => r.id !== id);
  saveDatabase();
  showToast("Record Deleted", "Borrow request record successfully deleted.", "success");
  renderAll();
}

function markBookStatus(id, newStatus) {
  if (!checkACL("u_book", "write")) {
    showToast("ACL Security Denied", "Librarian privileges required to write to Book table.", "error");
    return;
  }

  const book = books.find(b => b.id === id);
  if (book) {
    book.status = newStatus;
    saveDatabase();
    showToast("Record Updated", `Book status set to: ${newStatus}`, "success");
    renderAll();
  }
}

function completeBookReturn(requestId) {
  const req = borrowRequests.find(r => r.id === requestId);
  if (!req) return;

  const today = new Date().toISOString().split('T')[0];
  
  // Set request returned
  req.status = "returned";
  req.returnDate = today;

  // Set book available
  const book = books.find(b => b.id === req.bookId);
  if (book) {
    book.status = "available";
  }

  saveDatabase();
  showToast("Book Returned", `Book "${req.bookTitle}" has been returned to library. Catalog updated.`, "success");
  renderAll();
}

function openBorrowRequestModalForBook(bookId) {
  switchPage("myRequests");
  openRequestModal(bookId);
}

function triggerApprovalFlow(requestId, approve) {
  const req = borrowRequests.find(r => r.id === requestId);
  if (!req) return;

  // Trigger simulated flow engine
  runFlowApprovalSimulation(
    req,
    // Approved callback
    () => {
      // Flow actions performed:
      req.status = "approved";
      
      const book = books.find(b => b.id === req.bookId);
      if (book) {
        book.status = "issued";
      }
      
      saveDatabase();
      showToast("Request Approved", `Flow Completed: "${req.bookTitle}" issued to requester.`, "success");
      renderAll();
    },
    // Rejected callback
    () => {
      req.status = "rejected";
      saveDatabase();
      showToast("Request Rejected", `Flow Completed: Request set to Rejected.`, "warning");
      renderAll();
    }
  );
}

// ==========================================
// 10. NAVIGATION AND IMPERSONATOR
// ==========================================

function switchPage(pageId) {
  // Hide all sections
  const pages = document.querySelectorAll(".page-view");
  pages.forEach(p => p.classList.remove("active"));
  
  // Show target page
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  // Mark navigation active
  const navItems = document.querySelectorAll(".navigator-menu li");
  navItems.forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-page") === pageId) {
      item.classList.add("active");
    }
  });

  // Smooth scroll main pane to top
  document.getElementById("mainContent").scrollTop = 0;
}

function handleImpersonation(role) {
  currentUser = USER_ROLES[role];
  
  // Set body class for visual role rules
  document.body.className = "dark-mode role-" + role;
  
  // Update header profile details
  document.getElementById("userAvatar").textContent = currentUser.avatar;
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userRole").textContent = currentUser.role;

  showToast("User Impersonation", `Impersonating: ${currentUser.name} (${currentUser.role})`, "info");
  
  // Filter left nav sidebar segments
  const librarianSection = document.getElementById("librarianSection");
  if (role === "student") {
    librarianSection.style.display = "none";
    switchPage("catalog");
  } else {
    librarianSection.style.display = "block";
  }

  renderAll();
}

// ==========================================
// 11. FORM & MODAL HANDLERS
// ==========================================

function populateBookDropdown() {
  const dropdown = document.getElementById("reqBook");
  dropdown.innerHTML = '<option value="" disabled selected>-- Select a Book (Reference) --</option>';

  const refQualifierEnabled = document.getElementById("devReferenceQualifier").checked;

  const selectableBooks = books.filter(book => {
    if (refQualifierEnabled) {
      return book.status === "available";
    }
    return true; // Reference qualifier disabled: show all books
  });

  if (selectableBooks.length === 0) {
    dropdown.innerHTML += '<option value="" disabled>No books match reference qualifier filters.</option>';
  }

  selectableBooks.forEach(book => {
    let label = `${book.title} (by ${book.author}) [Status: ${book.status}]`;
    dropdown.innerHTML += `<option value="${book.id}">${label}</option>`;
  });
}

function openRequestModal(preselectedBookId = "") {
  const modal = document.getElementById("addRequestModal");
  
  // Populate student details
  document.getElementById("reqUser").value = currentUser.name;
  document.getElementById("reqUserVal").value = currentUser.id;
  document.getElementById("reqDate").value = new Date().toISOString().split('T')[0];
  
  // Reference Qualifier run
  populateBookDropdown();

  // If a book was preselected
  if (preselectedBookId) {
    document.getElementById("reqBook").value = preselectedBookId;
  }

  // Trigger initial UI Policy check (form reset)
  applyFormUIPolicy("requested");

  modal.classList.add("active");
}

function applyFormUIPolicy(status) {
  const uiPolicyActive = document.getElementById("devUIPolicy").checked;
  const returnDateField = document.getElementById("reqReturnDate");
  const returnDateLabelMarker = document.querySelector(".ui-policy-mandatory-marker");
  const uiPolicyMsg = document.getElementById("uiPolicyMsg");

  if (!uiPolicyActive) {
    // Reset/Clear UI policies
    returnDateField.required = false;
    returnDateField.disabled = false;
    returnDateLabelMarker.classList.add("hidden");
    uiPolicyMsg.classList.add("hidden");
    
    document.getElementById("reqBook").disabled = false;
    document.getElementById("reqDate").disabled = false;
    return;
  }

  // If Status is Approved/Issued -> Apply UI Policy
  if (status === "approved" || status === "issued") {
    // Make Return Date Mandatory and Visible
    returnDateField.required = true;
    returnDateField.disabled = false;
    returnDateLabelMarker.classList.remove("hidden");
    uiPolicyMsg.classList.remove("hidden");

    // Lock other fields
    document.getElementById("reqBook").disabled = true;
    document.getElementById("reqDate").disabled = true;
  } else {
    // Reset form fields
    returnDateField.required = false;
    returnDateLabelMarker.classList.add("hidden");
    uiPolicyMsg.classList.add("hidden");
    
    document.getElementById("reqBook").disabled = false;
    document.getElementById("reqDate").disabled = false;
  }
}

// ==========================================
// 12. INITIALIZATION & MAIN RENDER
// ==========================================

function renderAll() {
  renderCatalogTable();
  renderMyRequestsTable();
  renderAllRequestsTable();
  renderInventoryTable();
  renderReports();
}

window.addEventListener("DOMContentLoaded", () => {
  // Initialize Database
  initDatabase();

  // Initialize Documentation Render (Markdown parse)
  document.getElementById("blueprintMarkdown").innerHTML = renderMarkdown(technicalBlueprintMD);
  document.getElementById("setupMarkdown").innerHTML = renderMarkdown(setupManualMD);

  // Set default role playing environment (Student)
  handleImpersonation("student");

  // Page Routing Click Handlers
  const navItems = document.querySelectorAll(".navigator-menu li");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const pageId = item.getAttribute("data-page");
      switchPage(pageId);
    });
  });

  // Role Impersonation Event Handler
  document.getElementById("roleSelector").addEventListener("change", (e) => {
    handleImpersonation(e.target.value);
  });

  // Modal controls for Book Addition
  const addBookModal = document.getElementById("addBookModal");
  document.getElementById("addBookBtn").addEventListener("click", () => addBookModal.classList.add("active"));
  document.getElementById("addBookBtnInventory").addEventListener("click", () => addBookModal.classList.add("active"));
  document.getElementById("closeAddBookModal").addEventListener("click", () => addBookModal.classList.remove("active"));
  document.getElementById("cancelAddBook").addEventListener("click", () => addBookModal.classList.remove("active"));
  
  // Submit Book Record
  document.getElementById("addBookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!checkACL("u_book", "create")) {
      showToast("ACL Security Denied", "You must impersonate a Librarian to append records to u_book.", "error");
      addBookModal.classList.remove("active");
      return;
    }

    const title = document.getElementById("bookTitle").value.trim();
    const author = document.getElementById("bookAuthor").value.trim();
    const isbn = document.getElementById("bookISBN").value.trim();
    const status = document.getElementById("bookStatus").value;

    const newBook = {
      id: "b_" + (books.length + 1),
      title,
      author,
      isbn,
      status
    };

    books.push(newBook);
    saveDatabase();
    showToast("Book Inserted", `Created book record: "${title}"`, "success");
    addBookModal.classList.remove("active");
    e.target.reset();
    renderAll();
  });

  // Modal controls for Borrow Request
  const addRequestModal = document.getElementById("addRequestModal");
  document.getElementById("createRequestBtn").addEventListener("click", () => openRequestModal());
  document.getElementById("closeAddRequestModal").addEventListener("click", () => addRequestModal.classList.remove("active"));
  document.getElementById("cancelAddRequest").addEventListener("click", () => addRequestModal.classList.remove("active"));

  // Submit Borrow Request Form
  document.getElementById("addRequestForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!checkACL("u_borrow_request", "create")) {
      showToast("ACL Security Denied", "Students only are permitted to submit Borrow Requests.", "error");
      addRequestModal.classList.remove("active");
      return;
    }

    const bookSelect = document.getElementById("reqBook");
    const bookId = bookSelect.value;
    const bookObj = books.find(b => b.id === bookId);
    
    if (!bookObj) {
      showToast("Validation Error", "Please select a valid book from the dropdown catalog reference.", "error");
      return;
    }

    // Double check Reference Qualifier condition
    const refQualifierEnabled = document.getElementById("devReferenceQualifier").checked;
    if (refQualifierEnabled && bookObj.status !== "available") {
      showToast("Reference Qualifier Violation", `Book "${bookObj.title}" is already ${bookObj.status}. Select available books only.`, "error");
      return;
    }

    const reqId = "REQ-" + (1000 + borrowRequests.length + 1);
    const newRequest = {
      id: reqId,
      bookId: bookObj.id,
      bookTitle: bookObj.title,
      requestedById: currentUser.id,
      requestedByName: `${currentUser.name} (${currentUser.role === 'student' ? 'Student' : 'Librarian'})`,
      requestDate: document.getElementById("reqDate").value,
      returnDate: document.getElementById("reqReturnDate").value,
      status: "requested"
    };

    borrowRequests.push(newRequest);
    saveDatabase();
    showToast("Request Submitted", `Borrow request submitted successfully under tracking ID: ${reqId}`, "success");
    addRequestModal.classList.remove("active");
    e.target.reset();
    
    renderAll();

    // Trigger Flow Designer Simulator automatically
    setTimeout(() => {
      triggerApprovalFlow(reqId, true);
    }, 800);
  });

  // Toast close button
  document.getElementById("toastCloseBtn").addEventListener("click", () => {
    document.getElementById("toastNotification").classList.add("hidden");
  });

  // Live filter box for Book Catalog
  document.getElementById("catalogSearch").addEventListener("input", renderCatalogTable);
  document.getElementById("catalogStatusFilter").addEventListener("change", renderCatalogTable);

  // Developer Control Center Handlers
  document.getElementById("devToggleBtn").addEventListener("click", (e) => {
    const devPanel = document.getElementById("devPanel");
    devPanel.classList.toggle("minimized");
    e.target.innerHTML = devPanel.classList.contains("minimized") ? "&plus;" : "&minus;";
  });

  document.getElementById("resetMockDbBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset the mock database? All modifications will be lost.")) {
      resetDatabaseToDefault();
    }
  });

  // Developer controls checkbox updates trigger table rerender
  document.getElementById("devACLs").addEventListener("change", renderAll);
  document.getElementById("devReferenceQualifier").addEventListener("change", renderAll);
  document.getElementById("devUIPolicy").addEventListener("change", renderAll);
  
  // Console clear button
  document.getElementById("clearLogsBtn").addEventListener("click", () => {
    const consoleLogs = document.getElementById("consoleLogs");
    consoleLogs.innerHTML = `<div class="console-placeholder">Console logs cleared. Waiting for events...</div>`;
    document.getElementById("flowProgressBar").style.width = "0%";
  });

  // Filter navigator input search
  document.getElementById("navSearch").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const menuSections = document.querySelectorAll(".menu-section");
    
    menuSections.forEach(section => {
      const items = section.querySelectorAll("li");
      let sectionHasMatches = false;
      
      items.forEach(item => {
        const text = item.querySelector("span").textContent.toLowerCase();
        if (text.includes(query)) {
          item.style.display = "flex";
          sectionHasMatches = true;
        } else {
          item.style.display = "none";
        }
      });

      if (sectionHasMatches) {
        section.style.display = "block";
      } else {
        section.style.display = "none";
      }
    });
  });
});
