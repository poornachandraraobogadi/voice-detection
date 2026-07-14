# Setup Manual: ServiceNow Smart Library Request Workflow

This step-by-step manual outlines how to recreate the Smart Library Request Workflow in a ServiceNow Personal Developer Instance (PDI).

---

## Phase 1: Create Roles
1. Log in to your ServiceNow instance.
2. In the Application Navigator, search for **User Administration** and select **Roles**.
3. Click the **New** button at the top of the list.
4. Fill in the following details:
   - **User role**: `librarian`
   - **Description**: Library Administrator with permissions to manage books, approvals, and system settings.
5. Click **Submit**.
6. Click the **New** button again.
7. Fill in the details for the second role:
   - **User role**: `student`
   - **Description**: Library Client with permissions to view available books and request loans.
8. Click **Submit**.

---

## Phase 2: Create Tables & Add Fields

### Step 1: Create Book Table (`u_book`)
1. Search for **System Definition** in the navigator and click **Tables**.
2. Click **New**.
3. Configure the table:
   - **Label**: `Book`
   - **Name**: (automatically set to `u_book`)
   - **Create module**: Checked (default)
   - **Under Menu**: Library Services (create new if needed)
4. Click **Submit**.
5. Re-open the `u_book` table record and scroll down to the **Columns** related list. Add the following fields:
   - **Title** (`u_title`): Type = `String`, Max Length = `100`, Mandatory = `True`.
   - **Author** (`u_author`): Type = `String`, Max Length = `100`, Mandatory = `True`.
   - **ISBN** (`u_isbn`): Type = `String`, Max Length = `20`.
   - **Status** (`u_status`): Type = `Choice`, Default value = `available`.
     - *Choices*:
       - `available` (Label: Available)
       - `issued` (Label: Issued)
       - `lost` (Label: Lost)
6. Click **Update**.

### Step 2: Create Borrow Request Table (`u_borrow_request`)
1. Return to **System Definition -> Tables** and click **New**.
2. Configure the table:
   - **Label**: `Borrow Request`
   - **Name**: (automatically set to `u_borrow_request`)
3. Click **Submit**.
4. Re-open the `u_borrow_request` table and add the following fields in the **Columns** related list:
   - **Requested By** (`u_requested_by`): Type = `Reference`, Table = `sys_user`, Default Value = `javascript:gs.getUserID()`, Mandatory = `True`.
   - **Book** (`u_book`): Type = `Reference`, Table = `Book` (`u_book`), Mandatory = `True`.
   - **Request Date** (`u_request_date`): Type = `Date`, Default Value = `javascript:new GlideDate()`, Mandatory = `True`.
   - **Return Date** (`u_return_date`): Type = `Date`.
   - **Status** (`u_status`): Type = `Choice`, Default value = `requested`.
     - *Choices*:
       - `requested` (Label: Requested)
       - `approved` (Label: Approved)
       - `rejected` (Label: Rejected)
       - `returned` (Label: Returned)
5. Click **Update**.

---

## Phase 3: Configure Book Related List on Borrow Requests
1. Open the form of any Book record (or navigate to `u_book.do`).
2. Right-click the form header and choose **Configure -> Related Lists**.
3. Locate **Borrow Request -> Book** in the Available list and move it to the Selected list.
4. Click **Save**.
5. Verify that a related list named "Borrow Requests" now appears at the bottom of the Book form.

---

## Phase 4: Prevent Requesting Already-Issued Books (Reference Qualifier)
1. Navigate to **System Definition -> Tables** and open `Borrow Request` (`u_borrow_request`).
2. Scroll to the **Columns** related list and open the **Book** field record.
3. In the field form, toggle the **Advanced View** (under Related Links or by clicking the gear icon).
4. Locate the **Reference Qualifier** section and set:
   - **Use reference qualifier**: `Simple`
   - **Reference Qualifier Condition**: `Status` [is] `Available` (`u_status=available`)
5. Click **Update**.

---

## Phase 5: Flow Designer Setup (Approval & Status Automation)
1. Search for **Flow Designer** in the navigator and open it.
2. Click **New** -> **Flow**.
3. Name: `Borrow Request Approval Flow`. Click **Submit**.
4. **Trigger**:
   - Click **Add Trigger** and select **Created or Updated**.
   - **Table**: `Borrow Request [u_borrow_request]`
   - **Condition**: `Status` [is] `Requested` AND `Book` [is not empty].
   - Click **Done**.
5. **Action 1: Ask for Approval**:
   - Click **Add Action** -> Search for **Ask for Approval**.
   - **Record**: Drag in `Borrow Request Record` from the Trigger data pill.
   - **Rules**: Approve when: `Anyone approves`.
   - **Approvers**: Select users with the `librarian` role, or assign to a Librarian Group.
   - Click **Done**.
6. **Flow Logic: If Approved**:
   - Click **Add Flow Logic** -> select **If**.
   - **Label**: `If Approved`
   - **Condition**: `[Ask for Approval -> Approval State]` is `Approved`.
   - Click **Done**.
7. **Under "If Approved" Branch**:
   - **Action A: Update Book Status**:
     - Click **Add Action** -> **Update Record**.
     - **Record**: Drag in the Book reference field (`Trigger -> Borrow Request Record -> Book`).
     - **Fields**: `Status` = `Issued`.
   - **Action B: Update Request Status**:
     - Click **Add Action** -> **Update Record**.
     - **Record**: Drag in `Trigger -> Borrow Request Record`.
     - **Fields**: `Status` = `Approved`.
   - **Action C: Send Notification Email**:
     - Click **Add Action** -> **Send Email**.
     - **To**: Drag in `Trigger -> Borrow Request Record -> Requested By`.
     - **Subject**: `Your Borrow Request for [Book.Title] has been Approved`
     - **Body**: `Dear User, your borrow request for [Book.Title] has been approved. Please collect the book from the library. Return Date will be set upon pickup.`
8. **Flow Logic: If Rejected**:
   - Click **Add Flow Logic** -> select **Else**.
   - **Action A: Update Request Status**:
     - Click **Add Action** -> **Update Record**.
     - **Record**: Drag in `Trigger -> Borrow Request Record`.
     - **Fields**: `Status` = `Rejected`.
   - **Action B: Send Notification Email**:
     - Click **Add Action** -> **Send Email**.
     - **To**: Drag in `Trigger -> Borrow Request Record -> Requested By`.
     - **Subject**: `Your Borrow Request for [Book.Title] has been Rejected`
     - **Body**: `Dear User, your request to borrow [Book.Title] has been rejected. Please contact the librarian for more details.`
9. Click **Save** and click **Activate** in the top right.

---

## Phase 6: UI Policy (Mandatory Return Date and Read-Only Fields)
1. Search for **UI Policies** in the navigator and click **System UI -> UI Policies**.
2. Click **New**.
3. Configure the UI Policy:
   - **Table**: `Borrow Request [u_borrow_request]`
   - **Short Description**: `Make Return Date mandatory when Issued`
   - **Conditions**: `Status` [is] `Approved` OR `Status` [is] `Issued`
4. Right-click the header and click **Save** (keeps you on the same form).
5. Scroll down to the **UI Policy Actions** related list and click **New**.
6. Configure the Action:
   - **Field name**: `Return Date`
   - **Mandatory**: `True`
   - **Visible**: `True`
7. Click **Submit**.
8. Create another Action:
   - **Field name**: `Book`
   - **Read-only**: `True`
9. Click **Submit**.
10. Create another Action:
    - **Field name**: `Requested By`
    - **Read-only**: `True`
11. Click **Submit**.

---

## Phase 7: Access Control Lists (ACLs)
*Note: Elevate privileges to `security_admin` before working with ACLs.*

### Step 1: Book Table ACLs
1. Search for **Access Control (ACL)** in the navigator.
2. Click **New**.
3. Configure **Read** ACL:
   - **Type**: `record`
   - **Operation**: `read`
   - **Name**: `Book [u_book]` -> `*` (All fields)
   - **Requires role**: Add `student` and `librarian`.
   - Click **Submit**.
4. Configure **Write/Create/Delete** ACLs:
   - Create 3 separate ACLs for operations `create`, `write`, and `delete`.
   - **Name**: `Book [u_book]` -> `*`
   - **Requires role**: Add `librarian` only.
   - Click **Submit** for each.

### Step 2: Borrow Request Table ACLs
1. Click **New** in ACL list.
2. Configure **Create** ACL:
   - **Type**: `record`, **Operation**: `create`
   - **Name**: `Borrow Request [u_borrow_request]` -> `*`
   - **Requires role**: Add `student`.
   - Click **Submit**.
3. Configure **Read** ACL:
   - **Type**: `record`, **Operation**: `read`
   - **Name**: `Borrow Request [u_borrow_request]`
   - **Requires role**: Add `student`, `librarian`.
   - **Condition**: Add an advanced script or filter condition: `Requested By` [is (dynamic)] `Me` OR `gs.hasRole('librarian')`.
   - Click **Submit**.
4. Configure **Write** ACL:
   - **Type**: `record`, **Operation**: `write`
   - **Name**: `Borrow Request [u_borrow_request]`
   - **Requires role**: Add `librarian`.
   - Click **Submit**.

---

## Phase 8: Create "Most Borrowed Books" Report
1. Search for **Reports** in the navigator and select **View / Run**.
2. Click **Create a report** in the top right.
3. Configure Report:
   - **Report Name**: `Most Borrowed Books`
   - **Source Type**: `Table`
   - **Table**: `Borrow Request [u_borrow_request]`
4. Click **Next**.
5. Choose Type: **Bar** (under Bar charts). Click **Next**.
6. **Configure Tab**:
   - **Group by**: `Book`
   - **Aggregation**: `Count`
   - **Max number of groups**: `5`
7. **Filter Tab**:
   - Set condition: `Status` [is one of] `Approved, Returned` (to count only successfully issued books).
8. Click **Run** to generate the bar chart.
9. Click **Save**.
10. Click **Share** (icon in top-right list) -> **Share** -> Add roles `student` and `librarian` so everyone can see it. Click **Save**.
