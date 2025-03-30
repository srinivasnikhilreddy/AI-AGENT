import sql from 'mssql';

// SQL Server configuration
export const config = {
    user: 'sa',
    password: 'Srinivas@2003',
    server: 'DESKTOP-90BV8QB\\SQLEXPRESS',
    port: 1433, 
    database: 'AI_AJENTdb',
    options: {
        encrypt: false, // true for Azure, false for local
        trustServerCertificate: true // for local development
    }
};

export class UserService
{
    /*constructor(){
        this.connected = false; //class property accessible anywhere inside the class, It tracks the connection status
    }*/

    async getToDoList(){
        try{
            await sql.connect(config); //Connects to your MSSQL DB
            const request = new sql.Request(); //Creates a new query request object

            const userQuery = `SELECT * FROM todo`; //select query

            const result = await request.query(userQuery); //Executes the userQuery
            if(result.recordset.length > 0){
                //console.log('📋 ToDo List:', result.recordset); //Displays userQuery results
                return result.recordset;
            }else{
                //console.log('⚠️ No ToDo list found:');
                return '⚠️ No ToDo list found:';
            }
        }catch(err){
            console.error('❌ SQL getToDoList error', err);
        }finally{
            await sql.close(); //Close connection
            this.connected = false;
            //console.log('🔌 Connection closed.');
        }
    }

    async insertToDo(task) {
        try {
            await sql.connect(config);
            const request = new sql.Request();

            request.input('todo', sql.NVarChar(sql.MAX), task);
            request.input('status', sql.VarChar(50), 'pending');
            request.input('timestamp', sql.DateTime, new Date());

            await request.query(`INSERT INTO todo (todo, status, timestamp) VALUES(@todo, @status, @timestamp)`);
        } catch (err) {
            console.error('❌ SQL insertToDo error', err);
        } finally {
            await sql.close();
        }
    }

    async updateToDoStatus(task, newStatus) {
        try {
            await sql.connect(config);
            const request = new sql.Request();
            //console.log(task+","+newStatus);
            request.input('todo', sql.NVarChar(sql.MAX), task);
            request.input('status', sql.VarChar(50), newStatus);

            const result = await request.query(`UPDATE todo SET status = @status WHERE todo = @todo`);
            return result.rowsAffected[0] > 0 ? `✅ Yes! todo '${task}' updated to '${newStatus}'` : `⚠️Alas! No todo found: '${task}'`;
        } catch (err) {
            console.error('❌ SQL updateToDoStatus error', err);
        } finally {
            await sql.close();
        }
    }

    async deleteToDoByName(task) {
        try {
            await sql.connect(config);
            const request = new sql.Request();

            request.input('todo', sql.NVarChar(sql.MAX), task);

            const result = await request.query(`DELETE FROM todo WHERE todo = @todo`);
            return result.rowsAffected[0] > 0 ? `🗑️ todo '${task}' deleted` : `⚠️ Alas! No todo found: '${task}'`;
        } catch (err) {
            console.error('❌ SQL deleteToDoByName error', err);
        } finally {
            await sql.close();
        }
    }

    async deleteAllToDo() {
        try {
            await sql.connect(config);
            const request = new sql.Request();

            await request.query(`DELETE FROM todo`);
            return '🗑️ All todos have deleted';
        } catch (err) {
            console.error('❌ SQL deleteAllToDo error', err);
        } finally {
            await sql.close();
        }
    }

    async getToDoByStatus(status) {
        try {
            await sql.connect(config);
            const request = new sql.Request();

            request.input('status', sql.VarChar(50), status);

            const result = await request.query(`SELECT * FROM todo WHERE status = @status`);
            return result.recordset.length > 0 ? result.recordset : `⚠️ No todos found with status '${status}'`;
        } catch (err) {
            console.error('❌ SQL getToDoByStatus error', err);
        } finally {
            await sql.close();
        }
    }
}

/*
1. What all are there in my todo list? calls getToDoList()
2. Add todo tomorrow is an exam. calls insertToDo()
3. Are there any tasks related to 'exam'? calls getToDoList()
3. update todo tomorrow is an exam to completed. calls updateToDoStatus()
4. Are there any tasks pending/completed? calls updateToDoByStatus()
5. delete todo tomorrow is an exam. calls deleteToDoByName()
6. clear my todo list. calls deleteAllToDo()
 */
