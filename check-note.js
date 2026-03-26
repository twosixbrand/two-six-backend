async function run() {
  const syncRes = await fetch(`http://localhost:3050/api/v1/dian/notes/4/sync-status`, {
    method: 'POST',
    headers: {
      'x-api-key': 'TwoSixAdminKey123!'
    }
  });

  const syncBody = await syncRes.json();
  console.log("Resultado Sync:", syncBody.statusCode, syncBody.statusDescription);
  console.log("Is Valid:", syncBody.isValid);
  
  if (syncBody.note && syncBody.note.status_message) {
    const raw = syncBody.note.status_message;
    const msgRegex = /<c:string>(.*?)<\/c:string>/g;
    let match;
    console.log("--- ERRORES/NOTAS DE LA DIAN ---");
    let hasErrors = false;
    while ((match = msgRegex.exec(raw)) !== null) {
      console.log(match[1]);
      hasErrors = true;
    }
    if (!hasErrors) {
      console.log("No hay mensajes de error en la respuesta.");
    }
  }

  process.exit(0);
}
run();
