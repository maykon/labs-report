# Labs Report

This is a simple project that try solve problem about generate enterprise reports among differents products think in a simple way to create and delivery the reports by e-mail.

This was created using the principles of DRY, KISS and CoC. So, instead of many implementations, we can create some files following the conventions and the magic happens.
I chose to use the system file instead of database, for maintain its simple and easier to configurate and manage the reports.

# Usage

## SETUP

Configure the `.env` file with data about folders, databases and e-mail server.

Some standard folders are used:

- `REPORT_DIR=/home/node/app/reports`
  - The reports are create in this folder.
  - The name of folder need to clean without special characters and spaces.
  - Each report should stay inside itself folder.
  - Don't put the reports directly in the root folder.
- `IMG_DIR=/home/node/app/images`
  - Here, you can place the images used in reports.

You can use the `builder-docker.bat` to generate image and run `docker-compose up` to execute the container.

Or

The image can be pulled by [labs-report](https://hub.docker.com/r/maykoncapellari/labs-report) using the command `docker pull maykoncapellari/labs-report` before run `docker-compose up`.

## REPORTS

When you create one folder, you can put some special files that are used to configurate the report.

- `cron`: Used to schedule the report to run. The content shoud following this pattern:

  - Cron pattern:

  ```
   * * * * * *
   | | | | | |
   | | | | | |_ Sunday - Saturday (0-6)
   | | | | |_ January - December (0-11)
   | | | |_ Day (1,31)
   | | |_ Hours (0-23)
   | |_ Minutes (0-59)
   |_ Seconds (0-59)[Optional]`
  ```

  - If this file is not created, it is used `* * * * *` pattern that will be executated each 1 minute.

- `mail.json`: In this file, you can change defaults global configuration of email defined in `.env` file.

  - Example: [Nodemailer](https://nodemailer.com) settings can be used here. Besides allowing to reconfigure the transport config.

  ```
    {
        "subject": "Report XYZ",
        "to": [
            "Email1 <email1@example.com>",
            "email2@example.com"
        ],
        "transport": {
            "host": "smtp.office365.com",
            "port": 587,
            "auth": {
                "user": "report@example.com",
                "pass": "report"
            }
        }
    }
  ```

- `db.json`: In this file, you can change defaults global configuration of database connection defined in `.env` file.

  - Example: You can change all database configs or only one.

  ```
    {
      "pg": {
        "connectionString": "postgresql://postgres:postgres@localhost:5432/postgres"
      },
      "orcl": {
        "user": "oracle",
        "password": "oracle",
        "connectString": "localhost:1521/orcl"
      }
    }
  ```

- Files `.sql`: Here, you can put all the sql files that you will use in the report.

  - By default, the files must have only one SQL query, in addition to having a specific name that will inform the report manager which database driver to use.
  - The names cannot contain special characters
  - At the end of the name should have one of the 3 display options:
    - `table`: display the results of query in tabular form.
    - `list`: display the results of query in a list form (only the first column).
    - `text`: display the results of query as text (only the first column).
    - `nop`: no process and display results (used to set operations).
  - Plus de database driver name.

    - `pg`: Execute the query using Postgres connection configured in `.env` file.
    - `orcl`: Execute the query using Oracle connection configured in `.env` file.

    - Example of names:
      - query_table_pg.sql
      - report_xyz_list_orcl.sql
      - count_text_pg.sql
      - list_messages_nop_pg.sql

- `report.html`: Here the report to be sent must be defined.

  - You don't need to define the entire html structure.
  - A stylized html is already generated.
  - You can use a tag `style` to format the html file.
  - All the contents is inject inside de html/body tags.
  - To display the query results, it is necessary to follow this pattern:

    - In the place that you can display the information, put a tag with this pattern: `#(NAME_OF_FILE_IN_UPPERCASE_WITHOUT_SQL)`.
    - Examples:
      - `#(QUERY_TABLE_PG)`
      - `#(REPORT_XYZ_LIST_ORCL)`
      - `#(COUNT_TEXT_PG)`

  - Now is possible execute two SQLs and perform set operations on this querys.

    - Examples set operations:
      - `#(DIFERENCE(messages_core_nop_orcl, messages_base_nop_pg, message_id))`
      - `#(UNION(messages_core_nop_orcl, messages_base_nop_pg, message_id))`
      - `#(INTERSECTION(messages_core_nop_orcl, messages_base_nop_pg, message_id))`

  - To add images in report, put the file inside the image folder configurated in `IMG_DIR` env variable and add the tag `<img src="myfilename.png">` (the path must not be configured).
