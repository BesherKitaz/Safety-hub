import bcrypt from "bcrypt";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Password: ", async (password: string) => {
  const hash = await bcrypt.hash(password, 12);

  console.log("\nHash:");
  console.log(hash);

  rl.close();
});