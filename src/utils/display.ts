import chalk from 'chalk';
import type { ReviewStrategy } from '../types';

export async function displayReviewStrategy(
  strategy: ReviewStrategy,
  totalFiles: number
): Promise<void> {
  console.log(chalk.bold.blue('\n📋 Review Strategy\n'));

  // Review order
  console.log(chalk.bold.yellow('Review Order:'));
  
  // Show first 20 files in detail
  const filesToShowInDetail = 20;
  strategy.reviewOrder.slice(0, filesToShowInDetail).forEach((file, index) => {
    console.log(`\n${chalk.bold(`${index + 1}. ${file.filename}`)}`);
    console.log(`   ${chalk.gray(file.reason)}`);
  });
  
  // If there are more files, list them briefly
  if (strategy.reviewOrder.length > filesToShowInDetail) {
    console.log(chalk.yellow(`\n... and ${strategy.reviewOrder.length - filesToShowInDetail} more files:`));
    strategy.reviewOrder.slice(filesToShowInDetail).forEach((file, index) => {
      console.log(chalk.gray(`${index + filesToShowInDetail + 1}. ${file.filename}`));
    });
  }

  // Summary
  console.log(chalk.bold.cyan(`\n📊 Summary:`));
  console.log(`Total files in PR: ${totalFiles}`);
  console.log(`Files in review order: ${strategy.reviewOrder.length}`);
  
  if (strategy.reviewOrder.length < totalFiles) {
    console.log(chalk.red(`⚠️  Warning: ${totalFiles - strategy.reviewOrder.length} files were not included in the review order`));
  }

  // Review flags
  if (strategy.reviewFlags.length > 0) {
    console.log(chalk.bold.yellow('\n\n🚩 Review Checklist:'));
    strategy.reviewFlags.forEach((item) => {
      console.log(`\n${chalk.cyan(`• ${item.flag}`)}`);
      console.log(`  ${chalk.gray(item.description)}`);
    });
  }
}