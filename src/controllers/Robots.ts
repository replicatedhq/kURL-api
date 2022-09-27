import {Get} from "@tsed/schema";
import {Controller} from "@tsed/di";

@Controller("/robots.txt")
export class RobotsCtrl {
  @Get()
  robots(): string {
    return "User-agent: *\nDisallow: /";
  }
}
