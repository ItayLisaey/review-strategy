import chalk from "chalk";
import type { ReviewStrategy } from "../types";

export async function displayReviewStrategy(
  strategy: ReviewStrategy,
  totalFiles: number
): Promise<void> {
  // This function is now minimal since we don't want to display the order/checklist
  console.log(chalk.blue("∎ Dependency analysis completed"));

  // Just show basic summary
  if (strategy.reviewFlags.length > 0) {
    console.log(chalk.cyan("∎ Review considerations:"));
    strategy.reviewFlags.forEach((item) => {
      console.log(`  ${chalk.yellow("▫")} ${item.flag}: ${item.description}`);
    });
  }
}
