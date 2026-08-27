import { Alert, FeedbackBanner } from "@rbx/foundation-ui";

export default function TestDynamicComponent() {
  return (
    <Alert variant="Feedback" severity="Success" hasCloseAffordance={false}>
      Hello World!
    </Alert>
  );
}
