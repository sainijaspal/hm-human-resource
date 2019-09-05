### Review Tool

## About Project

- Language: Node (6+)
- Dependenctmanager: npm
- Framework: Express
- Database: PostgreSql

## How to install project on local
  
    Open CLI and run following commands to set up at local:
   - **Clone the project**
        >
            git clone https://github.com/uCreateit/ucreate-review-tool.git

   - **Set permissions**
       >
            sudo chmod -R 755 { project-path }

   - **Go to project directory**
       > 
            cd ucreate-review-tool 

   - **Copy .env.example to .env**
       > 
            cp .env.example .env
   - **Install node.js**
      > 
            To install node.js follow below url :
            https://nodejs.org/en/download/
   - **Install the dependencies**    
      >
            npm install
  


# Database installation
   - **How to install postgresql ( Ubuntu )**
     >
        sudo apt-get install postgresql postgresql-contrib
   - **Which UI being used to connect to DB**
     >
        pgadmin
   - **Create  database**
     >
         1. login to pgsql
         	 sudo psql -h localhost -U postgres    
         2. create database review-tool
         	 create database review-tool
         

# Post Installation steps
 - **Run database migrations**
    >
        sequelize db:migrate

- **Start server**
    >
        npm start
        The API will be running on http://localhost:4000 now [may differ in case port already in use]


