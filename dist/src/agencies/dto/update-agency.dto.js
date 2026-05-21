"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAgencyDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_agency_dto_1 = require("./create-agency.dto");
class UpdateAgencyDto extends (0, mapped_types_1.PartialType)(create_agency_dto_1.CreateAgencyDto) {
}
exports.UpdateAgencyDto = UpdateAgencyDto;
//# sourceMappingURL=update-agency.dto.js.map