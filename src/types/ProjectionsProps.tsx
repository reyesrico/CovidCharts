import CountryDataRow from './CountryDataRow';
import DataType from './DataType';

export default interface ProjectionsProps {
  data: CountryDataRow[],
  type: DataType,
  width: number
}
