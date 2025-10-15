import { Header } from "../Header";

export default function HeaderExample() {
  return (
    <div>
      <Header
        onSignIn={() => console.log("Sign in clicked")}
        onGetStarted={() => console.log("Get started clicked")}
      />
    </div>
  );
}
