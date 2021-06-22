import express, { Request, Response } from "express"
import knex from "knex"
import cors from "cors"
import dotenv from "dotenv"
import { AddressInfo } from "net"
import { convertDate } from "./function"
import { send } from "process"

dotenv.config()

export const connection = knex({
   client: "mysql",
   connection: {
      host: process.env.DB_HOST,
      port: 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
   }
}) 

const app = express()
app.use(express.json())
app.use(cors())

app.post("/class/insert", async (req: Request, res: Response) => {
   try{
      
      const {nome, data_de_inicio, data_de_encerramento, modulo} = req.body

   
      if (!nome || !data_de_inicio || !data_de_encerramento || (!modulo && modulo !== 0)){
         throw new Error ("Forneça corretamente o nome, data_de_inicio, data_de_encerramento e modulo")
      }

      const result = await connection.raw(`INSERT INTO CLASS 
      (nome, data_de_início, data_de_encerramento, modulo) VALUES(
         "${nome}",
         "${convertDate(data_de_inicio)}",
         "${convertDate(data_de_encerramento)}",
         ${modulo}
      )`)
      
      res.send({message: "Turma criada com sucesso!", status: 1})
      
   }catch (err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })
   }
   
});  

app.post ("/teachers/insert", async (req:Request, res:Response) => {
   try{

      const { nome, email, data_de_nascimento, turma } = req.body

      if(!nome || !email || !data_de_nascimento || !turma){
         throw new Error ("Forneça corretamente nome, email, data_de_nascimento, turma")
      }

      const result = await connection.raw(`INSERT INTO TEACHERS
      (nome, email, data_de_nascimento, turma) VALUES (
         "${nome}",
         "${email}",
         "${convertDate(data_de_nascimento)}",
         ${turma}
      )`)

      res.send({message: "Professor inserindo com sucesso!", status: 1 })

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })
   }

});

app.post ("/students/insert", async (req: Request, res: Response) => {
   try{

      const { nome, email, data_de_nascimento, turma } = req.body

      if (!nome || !email || !data_de_nascimento || !turma){
         throw new Error("Forneça Corretamente nome, email, data_de_nascimento, turma")
      }

      const result = await connection.raw(`INSERT INTO STUDENTS
      (nome, email, data_de_nascimento, class_id) VALUES(
         "${nome}",
         "${email}",
         "${convertDate(data_de_nascimento)}",
         ${turma}
      )`)

      res.send({ message: "Aluno inserido com sucesso!", status: 1 })

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })
   }
})

app.put ("/student/edit/class", async (req: Request, res: Response) => {
   try{

      const { id, novaTurma } = req.body

      if(!novaTurma || !id){
         throw new Error("Forneça Corretamente novaTurma, id")
      }

      const result = await connection.raw(`UPDATE STUDENTS 
      SET class_id = ${novaTurma}
      WHERE id = ${id}`)

      const result2 = await connection.raw(`SELECT STUDENTS.nome, STUDENTS.class_id FROM STUDENTS 
      JOIN CLASS ON STUDENTS.class_id = CLASS.id 
      WHERE STUDENTS.id=${id}`) // opção de código feita para o treinamento do uso do JOIN
      
      res
      .status(200)
      .send({ result2: [0][0], status:1 })

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })
   }
});

app.put ("/teacher/edit/class", async (req: Request, res: Response) => {
   try{

      const { id, novaTurma } = req.body

      if (!id || !novaTurma){
         throw new Error("Forneça Corretamente novaTurma, id")
      }

      const result = await connection.raw(`UPDATE TEACHERS
      SET turma = ${novaTurma}
      WHERE id = ${id}`)

      res
      .status(200)
      .send({result:[0], status:1 })


   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status:0 })
   }
});

app.get("/student/:id", async (req: Request, res: Response) => {

   try{

      const id = req.params.id

      const result  = await connection.raw(`SELECT s.nome, s.email, FLOOR(DATEDIFF(CURDATE(),s.data_de_nascimento) / 365.25) AS idade, c.nome AS turma
      FROM STUDENTS s JOIN CLASS c ON s.class_id = c.id 
      WHERE s.id = ${id}`)

      const result2 = await connection.raw(`SELECT hobby FROM HOBBY 
      WHERE student_id = ${id}`)

      result[0][0].hobbies = result2[0]

      res
      .status(200)
      .send({ result:[0][0], status: 1})

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status:0})
   }
})

app.get("/students/:class", async (req: Request, res: Response) => {

   try{

      const class_id = req.params.class

      const result = await connection.raw(`SELECT nome, class_id
      FROM STUDENTS
      WHERE class_id = ${class_id}`)

      res
      .status(200)
      .send({result:[0], status: 1})

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status:0 })
   }
});

app.get("/teachers/:class", async (req: Request, res: Response) =>{

   try{

      const class_id = req.params.class

      const result = await connection.raw(`SELECT nome, turma 
      FROM TEACHERS
      WHERE turma = ${class_id}`)

      res
      .status(200)
      .send({ result:[0], status: 1 })

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status:0 })
   }
});

app.put ("/class/edit/:id/novoModulo/:modulo", async(req: Request, res: Response) => {

   try{

      const {id, modulo} = req.params

      const result = await connection.raw(`UPDATE CLASS
      SET modulo = ${modulo}
      WHERE id = ${id}`)

      res
      .status(200)
      .send({ result:[0], status: 1 })

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })
   }
});

app.delete("/student/:id", async(req: Request, res: Response) => {
   try{

      const id = req.params.id

      const result = await connection.raw(`DELETE FROM STUDENTS
      WHERE id = ${id}`)

      if (result[0].affectedRows === 0){
         throw new Error("ID do Estudante não encontrado")
      }
      res
      .status(200)
      .send({ message: "Estudante deletado com sucesso!", status: 1 })
   
   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })
   }
});

app.post ("/student/add/hobby", async(req: Request, res: Response) => {

   try{

      const { hobby, student_id } = req.body
      
      if ( !hobby || !student_id ){
         throw new Error ("Forneça Corretamente o hobby e o student_id")
      }

      const result = await connection.raw(`INSERT INTO HOBBY (hobby, student_id) VALUES(
         "${hobby}",
         ${student_id}
      )`);

      res
      .status(200)
      .send({ result:[0], status: 1})

   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })

   }

});

app.get("/search/:hobby", async(req: Request, res: Response) =>{
   try{

      const search_hobby = req.params.hobby

      const result = await connection.raw(`SELECT s.nome, h.hobby FROM HOBBY h 
      JOIN STUDENTS s ON s.id = h.student_id
      WHERE h.hobby LIKE "%${search_hobby}%" `)

      res
      .status(200)
      .send({ result:[0], status: 1 })


   }catch(err){
      res
      .status(400)
      .send({ message: err.message, status: 0 })
   }
});

const server = app.listen(process.env.PORT || 3003, () => {
   if (server) {
      const address = server.address() as AddressInfo;
      console.log(`Server is running in http://localhost:${address.port}`);
   } else {
      console.error(`Failure upon starting server.`);
   }
})