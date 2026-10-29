import { UniversityDataSource } from "./university-data-source";
import { DemoDataSource } from "./demo/demo-data-source";
import { PostgresDataSource } from "./postgres/postgres-data-source";
import { ApiDataSource } from "./api/university-api-data-source";

export class UniversityDataSourceFactory {
  private static instance: UniversityDataSource | null = null;

  public static getDataSource(): UniversityDataSource {
    if (this.instance) {
      return this.instance;
    }

    const mode = (process.env.UNIVERSITY_DATA_SOURCE || "postgres").toLowerCase();

    switch (mode) {
      case "demo":
        this.instance = new DemoDataSource();
        break;
      case "api":
        this.instance = new ApiDataSource();
        break;
      case "postgres":
      default:
        this.instance = new PostgresDataSource();
        break;
    }

    console.log(`[UniversityDataSourceFactory] Initialized data source in '${this.instance!.mode}' mode.`);
    return this.instance!;
  }

  /**
   * For testing & switching modes dynamically.
   */
  public static setDataSource(dataSource: UniversityDataSource) {
    this.instance = dataSource;
  }

  public static reset() {
    this.instance = null;
  }
}
